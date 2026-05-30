import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { coordinates } from '../../../../test/data/HolySee';
import * as Export from './Position';

const { isPosition, isStrictPosition, isEquivalentPosition } = Export;

const altitude = coordinates.map(([lon, lat, alt = 1.23]) => [lon, lat, alt]);

describe('Domain/GeoJSON/Concept/Position', () => {
	describe('isPosition', () => {
		test('accepts all real-world coordinates', () => {
			assert.ok(
				coordinates.every(isPosition),
				'all coordinates match isPosition',
			);
			assert.ok(
				altitude.every(isPosition),
				'all coordinates with altitude match isPosition',
			);
		});

		test('accepts coordinates with any numeric values', () => {
			assert.ok(isPosition([0, 0, 0]), '[0, 0, 0] is Position');
			assert.ok(isPosition([-181, 0, 0]), '[-181, 0, 0] is Position');
			assert.ok(isPosition([0, -91, 0]), '[0, -91, 0] is Position');
			assert.ok(
				isPosition([0, 0, -7000000]),
				'[0, 0, -7000000] is Position',
			);
			assert.ok(isPosition([-181, -91, 0]), '[-181, -91, 0] is Position');
			assert.ok(
				isPosition([0, -91, -7000000]),
				'[0, -91, -7000000] is Position',
			);
			assert.ok(
				isPosition([-181, 0, -7000000]),
				'[-181, 0, -7000000] is Position',
			);
			assert.ok(
				isPosition([-181, -91, -7000000]),
				'[-181, -91, -7000000] is Position',
			);
		});

		test('rejects positions with Infinity values', () => {
			assert.ok(
				!isPosition([Infinity, 0, 0]),
				'[Infinity, 0, 0] is not a Position',
			);
			assert.ok(
				!isPosition([0, Infinity, 0]),
				'[0, Infinity, 0] is not a Position',
			);
			assert.ok(
				!isPosition([0, 0, Infinity]),
				'[0, 0, Infinity] is not a Position',
			);
		});
	});

	describe('isStrictPosition', () => {
		test('accepts all real-world coordinates', () => {
			assert.ok(
				coordinates.every(isStrictPosition),
				'all coordinates match isStrictPosition',
			);
			assert.ok(
				altitude.every(isStrictPosition),
				'all coordinates with altitude match isStrictPosition',
			);
		});

		test('accepts in-range coordinates', () => {
			assert.ok(
				isStrictPosition([0, 0, 0]),
				'[0, 0, 0] is strict Position',
			);
		});

		test('rejects out-of-range or invalid coordinates', () => {
			assert.ok(
				!isStrictPosition([Infinity, 0, 0]),
				'[Infinity, 0, 0] is not strict Position',
			);
			assert.ok(
				!isStrictPosition([0, Infinity, 0]),
				'[0, Infinity, 0] is not strict Position',
			);
			assert.ok(
				!isStrictPosition([0, 0, Infinity]),
				'[0, 0, Infinity] is not strict Position',
			);
			assert.ok(
				!isStrictPosition([-181, 0, 0]),
				'[-181, 0, 0] is not strict Position',
			);
			assert.ok(
				!isStrictPosition([0, -91, 0]),
				'[0, -91, 0] is not strict Position',
			);
			assert.ok(
				!isStrictPosition([0, 0, -7000000]),
				'[0, 0, -7000000] is not strict Position',
			);
			assert.ok(
				!isStrictPosition([-181, -91, 0]),
				'[-181, -91, 0] is not strict Position',
			);
			assert.ok(
				!isStrictPosition([0, -91, -7000000]),
				'[0, -91, -7000000] is not strict Position',
			);
			assert.ok(
				!isStrictPosition([-181, 0, -7000000]),
				'[-181, 0, -7000000] is not strict Position',
			);
			assert.ok(
				!isStrictPosition([-181, -91, -7000000]),
				'[-181, -91, -7000000] is not strict Position',
			);
		});
	});

	describe('isEquivalentPosition', () => {
		test('returns true for identical positions', () => {
			assert.ok(
				isEquivalentPosition(
					[1.23456789, 2.3456789],
					[1.23456789, 2.3456789],
				),
				'2D positions are equivalent',
			);
			assert.ok(
				isEquivalentPosition(
					[1.23456789, 2.3456789, 3.456789],
					[1.23456789, 2.3456789, 3.456789],
				),
				'3D positions are equivalent',
			);
		});

		test('returns false for positions with different dimensions', () => {
			assert.ok(
				!isEquivalentPosition(
					[1.23456789, 2.3456789, 3.456789],
					[1.23456789, 2.3456789],
				),
				'3D vs 2D position not equivalent',
			);
			assert.ok(
				!isEquivalentPosition(
					[1.23456789, 2.3456789],
					// biome-ignore lint/suspicious/noSparseArray: sparse array is the subject under test
					[1.23456789, 2.3456789, , 3.456789],
				),
				'2D vs sparse 3D position not equivalent',
			);
		});
	});
});
