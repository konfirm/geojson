import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { point, multipoint, polygon, featurecollection } from '../../../test/data/Shapes';
import { createBox, createBoxFromCoordinates, isWithinBox } from './Box';

describe('Domain/Utility/Box', () => {
	describe('createBoxFromCoordinates', () => {
		test('a single position produces a degenerate box (point)', () => {
			assert.deepStrictEqual(createBoxFromCoordinates([1, 2]), [1, 2, 1, 2]);
		});

		test('a line stretches the box to cover both endpoints', () => {
			assert.deepStrictEqual(createBoxFromCoordinates([[0, 1], [3, 4]]), [0, 1, 3, 4]);
		});

		test('a polygon ring computes the axis-aligned bounding box', () => {
			assert.deepStrictEqual(
				createBoxFromCoordinates([[[0, 0], [0, 3], [4, 3], [4, 0], [0, 0]]]),
				[0, 0, 4, 3],
			);
		});

		test('negative coordinates are handled correctly', () => {
			assert.deepStrictEqual(createBoxFromCoordinates([[-10, -5], [5, 3]]), [-10, -5, 5, 3]);
		});

		test('works for real-world polygon coordinates', () => {
			const [minLon, minLat, maxLon, maxLat] = createBoxFromCoordinates(polygon.coordinates);
			assert.ok(minLon < maxLon);
			assert.ok(minLat < maxLat);
		});
	});

	describe('createBox', () => {
		test('a Point shape produces a degenerate box', () => {
			const [minLon, minLat, maxLon, maxLat] = createBox(point);
			assert.strictEqual(minLon, maxLon);
			assert.strictEqual(minLat, maxLat);
		});

		test('a MultiPoint shape covers all points', () => {
			const [minLon, minLat, maxLon, maxLat] = createBox(multipoint);
			assert.ok(minLon < maxLon || minLat < maxLat);
			for (const [lon, lat] of multipoint.coordinates) {
				assert.ok(lon >= minLon && lon <= maxLon);
				assert.ok(lat >= minLat && lat <= maxLat);
			}
		});

		test('a FeatureCollection covers all contained geometries', () => {
			const box = createBox(featurecollection);
			const [minLon, minLat, maxLon, maxLat] = box;
			assert.ok(minLon < maxLon);
			assert.ok(minLat < maxLat);
			// individual shape boxes must be contained within the collection box
			const pointBox = createBox(point);
			assert.ok(pointBox[0] >= minLon && pointBox[2] <= maxLon);
			assert.ok(pointBox[1] >= minLat && pointBox[3] <= maxLat);
		});
	});

	describe('isWithinBox', () => {
		const box = [0, 0, 4, 3] as [number, number, number, number];

		test('returns true for a point inside the box', () => {
			assert.ok(isWithinBox([2, 1], box));
		});

		test('returns true for a point on the boundary', () => {
			assert.ok(isWithinBox([0, 0], box));
			assert.ok(isWithinBox([4, 3], box));
			assert.ok(isWithinBox([0, 3], box));
			assert.ok(isWithinBox([4, 0], box));
		});

		test('returns false for a point outside the box', () => {
			assert.ok(!isWithinBox([5, 1], box));
			assert.ok(!isWithinBox([2, 4], box));
			assert.ok(!isWithinBox([-1, 1], box));
		});
	});
});
