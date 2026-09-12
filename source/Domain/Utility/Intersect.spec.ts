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
});
