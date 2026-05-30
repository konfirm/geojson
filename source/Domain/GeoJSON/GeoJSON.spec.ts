import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { point, feature, featurecollection, geometrycollection } from '../../../test/data/Shapes';
import { isGeoJSON, isStrictGeoJSON } from './GeoJSON';

describe('isGeoJSON', () => {
	test('accepts all GeoJSON types', () => {
		assert.ok(isGeoJSON(point));
		assert.ok(isGeoJSON(feature));
		assert.ok(isGeoJSON(featurecollection));
		assert.ok(isGeoJSON(geometrycollection));
	});
	test('rejects non-GeoJSON values', () => {
		assert.ok(!isGeoJSON({ type: 'Unknown', coordinates: [0, 0] }));
		assert.ok(!isGeoJSON(null));
		assert.ok(!isGeoJSON(42));
	});
});

describe('isStrictGeoJSON', () => {
	test('accepts in-range GeoJSON', () => {
		assert.ok(isStrictGeoJSON(point));
		assert.ok(isStrictGeoJSON(feature));
	});
	test('rejects out-of-range coordinates', () => {
		assert.ok(!isStrictGeoJSON({ type: 'Point', coordinates: [-181, 0] }));
	});
});
