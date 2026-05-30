import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { feature, point, polygon } from '../../../test/data/Shapes';
import { isFeature, isStrictFeature } from './Feature';

describe('isFeature', () => {
	test('accepts a Feature with geometry', () => {
		assert.ok(
			isFeature({
				type: 'Feature',
				properties: null,
				geometry: { type: 'Point', coordinates: [0, 0] },
			}),
		);
		assert.ok(isFeature(feature));
	});

	test('rejects non-Feature shapes', () => {
		assert.ok(!isFeature(point));
		assert.ok(!isFeature(polygon));
	});
	test('rejects objects with missing fields', () => {
		assert.ok(!isFeature({ type: 'Feature' }));
		assert.ok(!isFeature({ type: 'Feature', geometry: null })); // missing properties
	});
});

describe('isStrictFeature', () => {
	test('accepts a Feature with strict geometry', () => {
		assert.ok(isStrictFeature(feature));
	});
	test('rejects a Feature with out-of-range geometry', () => {
		assert.ok(
			!isStrictFeature({
				type: 'Feature',
				properties: null,
				geometry: { type: 'Point', coordinates: [-181, 0] },
			}),
		);
	});
});
