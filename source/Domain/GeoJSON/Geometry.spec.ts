import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { point, linestring, polygon, geometrycollection, feature, featurecollection } from '../../../test/data/Shapes';
import { isGeometry, isStrictGeometry } from './Geometry';

describe('isGeometry', () => {
	test('accepts the six simple geometry types', () => {
		assert.ok(isGeometry(point));
		assert.ok(isGeometry(linestring));
		assert.ok(isGeometry(polygon));
		assert.ok(isGeometry({ type: 'MultiPoint', coordinates: [[0, 0]] }));
		assert.ok(isGeometry({ type: 'MultiLineString', coordinates: [[[0, 0], [1, 1]]] }));
		assert.ok(isGeometry({ type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]] }));
	});
	test('rejects container types', () => {
		assert.ok(!isGeometry(geometrycollection));
		assert.ok(!isGeometry(feature));
		assert.ok(!isGeometry(featurecollection));
	});
});

describe('isStrictGeometry', () => {
	test('accepts in-range geometries', () => {
		assert.ok(isStrictGeometry(point));
		assert.ok(isStrictGeometry(linestring));
		assert.ok(isStrictGeometry(polygon));
	});
	test('rejects out-of-range coordinates', () => {
		assert.ok(!isStrictGeometry({ type: 'Point', coordinates: [-181, 0] }));
	});
});
