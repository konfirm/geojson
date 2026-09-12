import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { LinearRing } from '../GeoJSON/Concept/LinearRing';
import type { Position } from '../GeoJSON/Concept/Position';
import { isPositionInSphericalRing } from './Spherical';

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
	});
});
