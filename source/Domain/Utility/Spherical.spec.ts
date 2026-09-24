import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { LinearRing } from '../GeoJSON/Concept/LinearRing';
import type { Position } from '../GeoJSON/Concept/Position';
import {
	exceedsHemisphere,
	isPositionInSphericalRing,
	orientedRingArea,
	ringArea,
} from './Spherical';

// Regression cases for https://github.com/konfirm/geojson/issues/18
//
// All expected values below are real MongoDB 8.3.9 $geoWithin results,
// collected via monger's mongo-catalog ground-truth harness (catalog
// `geoAntipodal`, cases around `equatorSplit*`/`meridianSplit`/
// `poleWedge`/`poleToPoleOnce`/`edgeModelTriangle`) — not derived, not
// guessed.

// A full circle of latitude — every edge a uniform 10-degree hop, closing
// edge included, so there's no antimeridian-jump ambiguity anywhere on the
// ring itself. Splits the globe into two caps.
function parallelRing(lat: number, step = 10): LinearRing {
	const ring: LinearRing = [];
	for (let lon = -180; lon < 180; lon += step) ring.push([lon, lat]);

	return [...ring, ring[0]];
}

// A run of same-latitude points from lonFrom to lonTo (open, no closing
// vertex) — dense enough that no single edge snaps to the short geodesic
// shortcut across the antimeridian. Used to build rings closed by
// vertical (meridian) edges rather than a full 360-degree circle.
function parallel(
	lat: number,
	lonFrom: number,
	lonTo: number,
	step: number,
): Array<Position> {
	const points: Array<Position> = [];
	const dir = lonTo >= lonFrom ? step : -step;
	for (let lon = lonFrom; dir > 0 ? lon <= lonTo : lon >= lonTo; lon += dir)
		points.push([lon, lat]);
	return points;
}

// A latitude band from -60 to 60, spanning -170 to 170 longitude (not a
// full 360-degree circle — closed by two vertical meridian edges at lon
// +-170 instead of wrapping). Covers ~82% of the sphere as literally
// wound; its complement (both polar caps beyond +-60 plus the thin
// longitude sliver near the antimeridian) is the smaller region. From
// issue #22.
function bandRing(): LinearRing {
	const ring: LinearRing = [
		...parallel(-60, -170, 170, 10),
		...parallel(60, 170, -170, 10),
	] as LinearRing;
	ring.push(ring[0]);

	return ring;
}

// Pole-to-pole: up meridian `lon` from -90 to 90, down the antimeridian
// `lon + 180` from 90 to -90. Consecutive same-latitude, opposite-longitude
// vertex pairs at both poles keep every edge either a uniform latitude
// step or a zero-length point-at-the-pole.
function meridianRing(lon: number, step = 10): LinearRing {
	const opposite = lon > 0 ? lon - 180 : lon + 180;
	const ring: Array<Position> = [];
	for (let lat = -90; lat <= 90; lat += step) ring.push([lon, lat]);
	for (let lat = 90; lat >= -90; lat -= step) ring.push([opposite, lat]);

	return [...ring, ring[0]];
}

// Pole-to-pole, but touching each pole exactly once, no duplicate/
// coincident vertices, unlike meridianRing above. Up meridian `lon` from
// -90 to 90, across to the antimeridian at the pole, back down to -90
function poleToPoleOnceRing(lon: number, step = 30): LinearRing {
	const opposite = lon > 0 ? lon - 180 : lon + 180;
	const ring: LinearRing = [];
	for (let lat = -90; lat <= 90; lat += step) ring.push([lon, lat]);
	for (let lat = 90 - step; lat >= -90 + step; lat -= step)
		ring.push([opposite, lat]);

	return [...ring, ring[0]];
}

describe('Domain/Utility/Spherical', () => {
	describe('isPositionInSphericalRing', () => {
		describe('unambiguous cap: ring at lat -1 (south cap is smaller, 89° vs 91°)', () => {
			const ring = parallelRing(-1);

			test('point south of the ring is inside', () => {
				assert.equal(isPositionInSphericalRing([90, -2], ring), true);
			});
			test('point north of the ring is outside', () => {
				assert.equal(isPositionInSphericalRing([90, 2], ring), false);
			});
		});

		describe('unambiguous cap: ring at lat 1 (north cap is smaller, 89° vs 91°)', () => {
			const ring = parallelRing(1);

			test('point north of the ring is inside', () => {
				assert.equal(isPositionInSphericalRing([90, 2], ring), true);
			});
			test('point south of the ring is outside', () => {
				assert.equal(isPositionInSphericalRing([90, -2], ring), false);
			});
		});

		describe('exact tie: ring at lat 0 (both caps exactly 90°) — winding decides', () => {
			const eastwardRing = parallelRing(0); // [-180,0],[-170,0],...,[170,0],[-180,0]
			const westwardRing = [...eastwardRing].reverse(); // same ring, opposite winding

			test('eastward winding: north side is inside', () => {
				assert.equal(
					isPositionInSphericalRing([90, 2], eastwardRing),
					true,
				);
			});
			test('eastward winding: south side is outside', () => {
				assert.equal(
					isPositionInSphericalRing([90, -2], eastwardRing),
					false,
				);
			});
			test('westward winding: south side is inside', () => {
				assert.equal(
					isPositionInSphericalRing([90, -2], westwardRing),
					true,
				);
			});
			test('westward winding: north side is outside', () => {
				assert.equal(
					isPositionInSphericalRing([90, 2], westwardRing),
					false,
				);
			});
		});

		describe('pole-to-pole meridian ring (prime meridian / antimeridian)', () => {
			// Real MongoDB rejects this geometry outright:
			//   "Loop is not valid: [...] Edges 20 and 35 cross."
			// It treats the duplicate same-latitude/opposite-longitude vertex
			// pairs at the poles as crossing edges, not degenerate points.
			// Self-intersection detection is deliberately not implemented yet
			// (see plan/spherical-polygon-containment.md) — these document
			// the gap, they're expected to keep failing until that lands.
			const ring = meridianRing(0);

			test('should reject the geometry rather than silently pick a side', () => {
				assert.throws(() => isPositionInSphericalRing([-2, 45], ring));
			});
			test('should reject the geometry rather than silently pick a side (other side)', () => {
				assert.throws(() => isPositionInSphericalRing([2, 45], ring));
			});
		});

		describe('vertex-at-pole scope, case A: clean single-pole wedge, no self-crossing', () => {
			// Isolates "touches a pole" from meridianRing's self-crossing
			// construction. Real MongoDB accepts this with no error.
			const ring: Array<Position> = [
				[0, 90],
				[0, 60],
				[90, 60],
				[0, 90],
			];

			test('point inside the wedge is inside', () => {
				assert.equal(isPositionInSphericalRing([45, 75], ring), true);
			});
			test('point below the wedge is outside', () => {
				assert.equal(isPositionInSphericalRing([45, 50], ring), false);
			});
			test('point on the opposite side of the globe, same latitude, is outside', () => {
				assert.equal(
					isPositionInSphericalRing([-160, 75], ring),
					false,
				);
			});
		});

		describe('vertex-at-pole scope, case B: pole-to-pole, each pole touched once', () => {
			// Same overall shape as the meridian ring above, but without its
			// duplicate-vertex artifact at each pole. Real MongoDB accepts
			// this with no error (unlike meridianRing) — confirming it was
			// the self-crossing construction, not the pole-touching, that
			// triggered "Edges cross" there. Also an exact hemisphere tie
			// (like the equator-split case), independently confirming the
			// winding tie-break rule.
			const east: Position = [90, 10];
			const west: Position = [-90, 10];
			const forwardRing = poleToPoleOnceRing(0);
			const reversedRing = [...forwardRing].reverse();

			test('does not throw for a valid pole-touching ring', () => {
				assert.doesNotThrow(() =>
					isPositionInSphericalRing(east, forwardRing),
				);
			});
			test('forward winding: west side is inside', () => {
				assert.equal(
					isPositionInSphericalRing(west, forwardRing),
					true,
				);
			});
			test('forward winding: east side is outside', () => {
				assert.equal(
					isPositionInSphericalRing(east, forwardRing),
					false,
				);
			});
			test('reversed winding: east side is inside', () => {
				assert.equal(
					isPositionInSphericalRing(east, reversedRing),
					true,
				);
			});
			test('reversed winding: west side is outside', () => {
				assert.equal(
					isPositionInSphericalRing(west, reversedRing),
					false,
				);
			});
		});

		describe('edge model: geodesic vs. flat lon/lat line', () => {
			// Triangle sized so a geodesic edge and a flat lon/lat-line edge
			// disagree over a wide margin. Real MongoDB matches all three
			// probe points, confirming 2dsphere interpolates edges as
			// geodesics.
			const ring: Array<Position> = [
				[-40, 0],
				[40, 0],
				[0, 70],
				[-40, 0],
			];

			test('point a is inside (geodesic edge)', () => {
				assert.equal(isPositionInSphericalRing([-15, 55], ring), true);
			});
			test('point b is inside (geodesic edge)', () => {
				assert.equal(isPositionInSphericalRing([20, 50], ring), true);
			});
			test('point c is inside', () => {
				assert.equal(isPositionInSphericalRing([0, 65], ring), true);
			});
		});

		describe('band ring closed by vertical edges (issue #22)', () => {
			// A latitude band from -60 to 60, spanning -170 to 170 longitude
			// (not a full 360-degree circle — closed by two vertical meridian
			// edges at lon +-170 instead of wrapping). The band itself covers
			// ~82% of the sphere; the smaller region is its complement (both
			// polar caps beyond +-60 plus the thin longitude sliver between
			// them near the antimeridian).
			//
			// A prior vertex-centroid heuristic for "which side is smaller"
			// picked the band (the *larger* region) here, because the
			// centroid of this ring's own vertices sits inside the band
			// regardless of which region is actually smaller by area — wrong
			// regardless of winding, not a winding bug. Expected values are
			// real MongoDB 8.3.9 $geoWithin results, default mode (no
			// crs:strictwinding), via mongo-catalog's geo-antipodal ground
			// truth: both windings agree, matching the smaller-area
			// convention exactly once the region is identified correctly.
			const forwardRing = bandRing();
			const reversedRing = [...forwardRing].reverse();

			const deepInBand: Position = [0, 0];
			const deepInPolarCap: Position = [45, 75];

			test('forward winding: point deep in the band is outside', () => {
				assert.equal(
					isPositionInSphericalRing(deepInBand, forwardRing),
					false,
				);
			});
			test('forward winding: point deep in the polar cap is inside', () => {
				assert.equal(
					isPositionInSphericalRing(deepInPolarCap, forwardRing),
					true,
				);
			});
			test('reversed winding: point deep in the band is outside', () => {
				assert.equal(
					isPositionInSphericalRing(deepInBand, reversedRing),
					false,
				);
			});
			test('reversed winding: point deep in the polar cap is inside', () => {
				assert.equal(
					isPositionInSphericalRing(deepInPolarCap, reversedRing),
					true,
				);
			});
		});

		describe('degenerate ring: all vertices coincide (issue #27, e.g. a $box query with equal corners)', () => {
			const degenerate: LinearRing = [
				[5.9, 52],
				[5.9, 52],
				[5.9, 52],
				[5.9, 52],
				[5.9, 52],
			];

			test('the coincident point itself is not reported as interior', () => {
				assert.equal(
					isPositionInSphericalRing([5.9, 52], degenerate),
					false,
				);
			});

			test('a point nowhere near it is outside', () => {
				assert.equal(
					isPositionInSphericalRing([10.9, 57], degenerate),
					false,
				);
			});
		});

		describe('partially degenerate ring: one vertex listed twice in a row (issue #29)', () => {
			// A real triangle, 3 distinct vertices, but the first one is
			// duplicated — a zero-length edge #27's fully-degenerate guard
			// doesn't catch, since this ring still has >= 3 distinct vertices.
			const withDupe: LinearRing = [
				[5.9, 52],
				[5.9, 52],
				[6.9, 52],
				[6.9, 53],
				[5.9, 52],
			];
			const withoutDupe: LinearRing = [
				[5.9, 52],
				[6.9, 52],
				[6.9, 53],
				[5.9, 52],
			];

			test('gives the same answer as the equivalent ring without the duplicate, for a point nowhere near it', () => {
				assert.equal(
					isPositionInSphericalRing([25.9, 72], withDupe),
					isPositionInSphericalRing([25.9, 72], withoutDupe),
				);
				assert.equal(
					isPositionInSphericalRing([25.9, 72], withDupe),
					false,
				);
			});

			test('gives the same answer as the equivalent ring without the duplicate, for a point genuinely inside', () => {
				assert.equal(
					isPositionInSphericalRing([5.905, 52.005], withDupe),
					isPositionInSphericalRing([5.905, 52.005], withoutDupe),
				);
				assert.equal(
					isPositionInSphericalRing([5.905, 52.005], withDupe),
					true,
				);
			});
		});
	});

	describe('ringArea', () => {
		test('a full hemisphere is 2*PI steradians', () => {
			const equator: LinearRing = parallelRing(0);

			assert.ok(Math.abs(ringArea(equator) - 2 * Math.PI) < 1e-9);
		});

		test('a small triangle is a small fraction of 4*PI', () => {
			const triangle: LinearRing = [
				[0, 0],
				[10, 0],
				[5, 10],
				[0, 0],
			];

			const area = ringArea(triangle);

			assert.ok(area > 0 && area < 0.1);
		});

		test('the same small triangle wound the other way is close to the whole sphere, not the same small value', () => {
			const triangle: LinearRing = [
				[0, 0],
				[10, 0],
				[5, 10],
				[0, 0],
			];

			assert.ok(ringArea([...triangle].reverse()) > 4 * Math.PI - 0.1);
		});

		test('a spherical cap matches the closed-form cap-area formula', () => {
			const ring = parallelRing(60, 1);
			const expected = 2 * Math.PI * (1 - Math.sin((60 * Math.PI) / 180));

			assert.ok(Math.abs(ringArea(ring) - expected) < 1e-4);
		});

		test("reversing a ring gives the complementary region's area", () => {
			const ring = parallelRing(1);

			assert.ok(
				Math.abs(
					ringArea(ring) +
						ringArea([...ring].reverse()) -
						4 * Math.PI,
				) < 1e-9,
			);
		});

		test('if no ring was given, it should return 0', () => {
			const inputA = [
				[0, 0],
				[10, 0],
			];
			const inputB = [[0, 0]];

			assert.equal(ringArea(inputA as LinearRing), 0);
			assert.equal(ringArea(inputB as LinearRing), 0);
		});

		test('all-coincident vertices report 0, not 2*PI', () => {
			const degenerate: LinearRing = [
				[5.9, 52],
				[5.9, 52],
				[5.9, 52],
				[5.9, 52],
				[5.9, 52],
			];

			assert.equal(ringArea(degenerate), 0);
			assert.equal(exceedsHemisphere(degenerate), false);
		});
	});

	describe('orientedRingArea', () => {
		// Never negative — see Spherical.ts for why the sphere doesn't have a
		// classic "negative for clockwise" signed area. CW vs CCW is which
		// side of 2*PI the value falls on, exercised via Winding.spec.ts,
		// which calls this indirectly through isClockwiseWinding /
		// isCounterClockwiseWinding.

		test('fewer than 3 distinct vertices has no orientation', () => {
			assert.equal(orientedRingArea([]), null);
			assert.equal(orientedRingArea([[0, 0]]), null);
			assert.equal(
				orientedRingArea([
					[0, 0],
					[1, 0],
				]),
				null,
			);
			assert.equal(
				orientedRingArea([
					[0, 0],
					[1, 0],
					[0, 0],
				]),
				null,
			);
		});

		test('all-coincident vertices (e.g. a $box query with equal corners) has no orientation, despite 4+ array entries', () => {
			assert.equal(
				orientedRingArea([
					[5.9, 52],
					[5.9, 52],
					[5.9, 52],
					[5.9, 52],
					[5.9, 52],
				]),
				null,
			);
		});

		test('a genuine triangle with one vertex listed twice in a row has the same orientation as without the duplicate (issue #29)', () => {
			const withDupe: LinearRing = [
				[5.9, 52],
				[5.9, 52],
				[6.9, 52],
				[6.9, 53],
				[5.9, 52],
			];
			const withoutDupe: LinearRing = [
				[5.9, 52],
				[6.9, 52],
				[6.9, 53],
				[5.9, 52],
			];

			assert.equal(
				orientedRingArea(withDupe),
				orientedRingArea(withoutDupe),
			);
			assert.notEqual(orientedRingArea(withDupe), null);
		});

		test('a self-intersecting ("bowtie") ring has no orientation', () => {
			const bowtie: LinearRing = [
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1],
				[0, 0],
			];

			assert.equal(orientedRingArea(bowtie), null);
		});

		test('an ordinary simple ring has a real, non-null orientation', () => {
			const triangle: LinearRing = [
				[0, 0],
				[10, 0],
				[5, 10],
				[0, 0],
			];

			assert.notEqual(orientedRingArea(triangle), null);
		});

		test('if no ring was given, it should return null', () => {
			const inputA = [
				[0, 0],
				[10, 0],
			];
			const inputB = [[0, 0]];

			assert.equal(orientedRingArea(inputA as LinearRing), null);
			assert.equal(orientedRingArea(inputB as LinearRing), null);
		});
	});

	describe('exceedsHemisphere', () => {
		test('an exact hemisphere tie does not exceed it', () => {
			assert.equal(exceedsHemisphere(parallelRing(0)), false);
		});

		test('a ring literally enclosing the larger region exceeds it', () => {
			assert.equal(exceedsHemisphere(bandRing()), true);
		});

		test('a small triangle does not exceed it', () => {
			const triangle: LinearRing = [
				[0, 0],
				[10, 0],
				[5, 10],
				[0, 0],
			];

			assert.equal(exceedsHemisphere(triangle), false);
		});

		test('agrees with comparing ringArea() to 2*PI directly', () => {
			const ring = parallelRing(1);

			assert.equal(exceedsHemisphere(ring), ringArea(ring) > 2 * Math.PI);
		});
	});
});
