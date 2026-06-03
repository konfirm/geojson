import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
	feature,
	featurecollection,
	geometrycollection,
	linestring,
	point,
	polygon,
} from '../../../test/data/Shapes';
import {
	isGeometry,
	isGeometryCollection,
	isStrictGeometry,
	isStrictGeometryCollection,
} from './Geometry';

describe('GeometryCollection', () => {
	describe('isGeometryCollection', () => {
		test('accepts a GeometryCollection', () => {
			assert.ok(
				isGeometryCollection({
					type: 'GeometryCollection',
					geometries: [],
				}),
			);
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
			assert.ok(
				!isStrictGeometryCollection({
					type: 'GeometryCollection',
					geometries: [{ type: 'Point', coordinates: [-181, 0] }],
				}),
			);
		});
	});
});

describe('Geometry', () => {
	describe('isGeometry', () => {
		test('accepts the six simple geometry types and isGeometryCollection', () => {
			assert.ok(isGeometry(point));
			assert.ok(isGeometry(linestring));
			assert.ok(isGeometry(polygon));
			assert.ok(
				isGeometry({ type: 'MultiPoint', coordinates: [[0, 0]] }),
			);
			assert.ok(
				isGeometry({
					type: 'MultiLineString',
					coordinates: [
						[
							[0, 0],
							[1, 1],
						],
					],
				}),
			);
			assert.ok(
				isGeometry({
					type: 'MultiPolygon',
					coordinates: [
						[
							[
								[0, 0],
								[1, 0],
								[1, 1],
								[0, 0],
							],
						],
					],
				}),
			);
			assert.ok(isGeometry(geometrycollection));
		});

		test('rejects container types', () => {
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
			assert.ok(
				!isStrictGeometry({ type: 'Point', coordinates: [-181, 0] }),
			);
		});
	});
});
