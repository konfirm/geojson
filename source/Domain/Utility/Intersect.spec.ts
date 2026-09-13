import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Improbability } from '../../../test/helper/spec';
import type { LineString, Point, Polygon } from '../../main';
import { intersect } from './Intersect';

describe('intersect', () => {
	describe('point and polygon', () => {
		const box: Polygon = {
			type: 'Polygon',
			coordinates: [
				[
					[0, 0],
					[0, 2],
					[2, 2],
					[2, 0],
					[0, 0],
				],
			],
		};

		test('point inside polygon intersects', () => {
			const inside: Point = { type: 'Point', coordinates: [1, 1] };
			assert.ok(intersect(inside, box));
			assert.ok(intersect(box, inside)); // symmetric
		});
		test('point outside polygon does not intersect', () => {
			assert.ok(!intersect({ type: 'Point', coordinates: [3, 3] }, box));
		});
		test('point on the boundary intersects', () => {
			assert.ok(intersect({ type: 'Point', coordinates: [0, 0] }, box));
		});
	});

	describe('line strings', () => {
		test('crossing lines intersect', () => {
			const a: LineString = {
				type: 'LineString',
				coordinates: [
					[0, 0],
					[2, 2],
				],
			};
			const b: LineString = {
				type: 'LineString',
				coordinates: [
					[0, 2],
					[2, 0],
				],
			};
			assert.ok(intersect(a, b));
		});
		test('parallel lines do not intersect', () => {
			const a: LineString = {
				type: 'LineString',
				coordinates: [
					[0, 0],
					[2, 0],
				],
			};
			const b: LineString = {
				type: 'LineString',
				coordinates: [
					[0, 1],
					[2, 1],
				],
			};
			assert.ok(!intersect(a, b));
		});
	});

	describe('geometry crossing the antimeridian', () => {
		test('a dateline-hopping line does not falsely intersect a distant meridian, in both argument orders', () => {
			// a short hop across the dateline; b sits at lon=0, nowhere near it
			const a: LineString = {
				type: 'LineString',
				coordinates: [
					[179, -1],
					[-179, 1],
				],
			};
			const b: LineString = {
				type: 'LineString',
				coordinates: [
					[0, -1],
					[0, 1],
				],
			};

			assert.ok(!intersect(a, b));
			assert.ok(!intersect(b, a));
		});

		test('a point inside a dateline-straddling polygon intersects it', () => {
			const box: Polygon = {
				type: 'Polygon',
				coordinates: [
					[
						[179, 0],
						[-179, 0],
						[-179, 2],
						[179, 2],
						[179, 0],
					],
				],
			};
			assert.ok(intersect({ type: 'Point', coordinates: [180, 1] }, box));
			assert.ok(!intersect({ type: 'Point', coordinates: [0, 1] }, box));
		});
	});

	describe('unknown geometry types', () => {
		test('returns false for unrecognised types', () => {
			const unknown = {
				type: 'Unknown',
				coordinates: [0, 0],
			} as Improbability;
			assert.ok(
				!intersect(unknown, { type: 'Point', coordinates: [0, 0] }),
			);
			assert.ok(
				!intersect({ type: 'Point', coordinates: [0, 0] }, unknown),
			);
		});
	});

	describe('large/ambiguous ring (issue #18 wiring check)', () => {
		// Not a correctness suite — that lives in Spherical.spec.ts against
		// isPositionInSphericalRing directly. Just confirms intersect()
		// still wires down to it correctly for a ring spanning most of the
		// globe, where flat-plane ray-casting used to invert the answer.
		const ring: Polygon = {
			type: 'Polygon',
			coordinates: [
				[
					[-180, -1],
					[-120, -1],
					[-60, -1],
					[0, -1],
					[60, -1],
					[120, -1],
					[-180, -1],
				],
			],
		};

		test('point in the smaller (south) cap intersects', () => {
			assert.ok(
				intersect({ type: 'Point', coordinates: [90, -45] }, ring),
			);
		});
		test('point in the larger (north) cap does not intersect', () => {
			assert.ok(
				!intersect({ type: 'Point', coordinates: [90, 45] }, ring),
			);
		});
	});

	describe('band ring closed by vertical edges (issue #22 wiring check)', () => {
		// Not a correctness suite — that lives in Spherical.spec.ts against
		// isPositionInSphericalRing directly. Just confirms intersect() still
		// wires down to it correctly for a ring shaped like a wide latitude
		// band (not a full 360-degree circle), where a vertex-centroid
		// heuristic used to pick the larger region as "inside".
		//
		// Needs the same dense-vertex construction as the correctness suite:
		// a geodesic edge between two far-apart same-latitude points cuts
		// straight across (toward the pole), it doesn't follow the parallel —
		// a coarse 4-vertex rectangle would silently test a different shape.
		function parallel(
			lat: number,
			lonFrom: number,
			lonTo: number,
			step: number,
		) {
			const points: Array<[number, number]> = [];
			const dir = lonTo >= lonFrom ? step : -step;
			for (
				let lon = lonFrom;
				dir > 0 ? lon <= lonTo : lon >= lonTo;
				lon += dir
			)
				points.push([lon, lat]);
			return points;
		}

		const band = [
			...parallel(-60, -170, 170, 10),
			...parallel(60, 170, -170, 10),
		];
		const ring: Polygon = {
			type: 'Polygon',
			coordinates: [[...band, band[0]]],
		};

		test('point deep in the band does not intersect', () => {
			assert.ok(!intersect({ type: 'Point', coordinates: [0, 0] }, ring));
		});
		test('point deep in the polar cap intersects', () => {
			assert.ok(
				intersect({ type: 'Point', coordinates: [45, 75] }, ring),
			);
		});
	});
});
