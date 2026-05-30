import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { geometrycollection, feature, point } from '../../../test/data/Shapes';
import { isGeometryCollection, isStrictGeometryCollection } from './GeometryCollection';

describe('isGeometryCollection', () => {
	test('accepts a GeometryCollection', () => {
		assert.ok(isGeometryCollection({ type: 'GeometryCollection', geometries: [] }));
		assert.ok(isGeometryCollection(geometrycollection));
	});
	test('rejects non-GeometryCollection shapes', () => {
		assert.ok(!isGeometryCollection(feature));
		assert.ok(!isGeometryCollection(point));
	});
	test('rejects objects with missing fields', () => {
		assert.ok(!isGeometryCollection({ type: 'GeometryCollection' }));
	});
});

describe('isStrictGeometryCollection', () => {
	test('accepts a GeometryCollection with strict geometries', () => {
		assert.ok(isStrictGeometryCollection(geometrycollection));
	});
	test('rejects a GeometryCollection with out-of-range geometry', () => {
		assert.ok(!isStrictGeometryCollection({
			type: 'GeometryCollection',
			geometries: [{ type: 'Point', coordinates: [-181, 0] }],
		}));
	});
});
