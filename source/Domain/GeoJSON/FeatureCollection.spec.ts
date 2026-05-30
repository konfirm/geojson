import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { featurecollection, feature, point } from '../../../test/data/Shapes';
import { isFeatureCollection, isStrictFeatureCollection } from './FeatureCollection';

describe('isFeatureCollection', () => {
	test('accepts a FeatureCollection', () => {
		assert.ok(isFeatureCollection({ type: 'FeatureCollection', features: [] }));
		assert.ok(isFeatureCollection(featurecollection));
	});
	test('rejects non-FeatureCollection shapes', () => {
		assert.ok(!isFeatureCollection(feature));
		assert.ok(!isFeatureCollection(point));
	});
	test('rejects objects with missing fields', () => {
		assert.ok(!isFeatureCollection({ type: 'FeatureCollection' }));
	});
});

describe('isStrictFeatureCollection', () => {
	test('accepts a FeatureCollection with strict geometries', () => {
		assert.ok(isStrictFeatureCollection(featurecollection));
	});
	test('rejects a FeatureCollection with out-of-range geometry', () => {
		assert.ok(!isStrictFeatureCollection({
			type: 'FeatureCollection',
			features: [{ type: 'Feature', properties: null, geometry: { type: 'Point', coordinates: [-181, 0] } }],
		}));
	});
});
