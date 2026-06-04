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
	isGeometryPrimitive,
	isStrictGeometry,
	isStrictGeometryCollection,
	isStrictGeometryPrimitive,
} from './Geometry';
import { isPoint } from './Geometry/Point';
import { isStrictPolygon } from './Geometry/Polygon';

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

	describe('isGeometryCollection with geometry guard', () => {
		const pointCollection = {
			type: 'GeometryCollection',
			geometries: [point, { type: 'Point', coordinates: [0, 0] }],
		};

		test('accepts a GeometryCollection where all geometries match the guard', () => {
			assert.ok(isGeometryCollection(pointCollection, isPoint));
		});
		test('rejects a GeometryCollection where any geometry does not match the guard', () => {
			assert.ok(!isGeometryCollection(geometrycollection, isPoint));
		});
		test('accepts an empty GeometryCollection with any guard', () => {
			assert.ok(
				isGeometryCollection(
					{ type: 'GeometryCollection', geometries: [] },
					isPoint,
				),
			);
		});
	});

	describe('isStrictGeometryCollection with geometry guard', () => {
		const strictPolygonCollection = {
			type: 'GeometryCollection',
			geometries: [polygon],
		};
		const outOfRangeCollection = {
			type: 'GeometryCollection',
			geometries: [
				{
					type: 'Polygon',
					coordinates: [
						[
							[0, 0],
							[181, 0],
							[181, 1],
							[0, 0],
						],
					],
				},
			],
		};

		test('accepts a GeometryCollection where all geometries match the strict guard', () => {
			assert.ok(
				isStrictGeometryCollection(
					strictPolygonCollection,
					isStrictPolygon,
				),
			);
		});
		test('rejects a GeometryCollection where any geometry fails the strict guard', () => {
			assert.ok(
				!isStrictGeometryCollection(
					outOfRangeCollection,
					isStrictPolygon,
				),
			);
		});
	});
});

describe('GeometryPrimitive', () => {
	describe('isGeometryPrimitive', () => {
		test('accepts the six coordinate-bearing geometry types', () => {
			assert.ok(isGeometryPrimitive(point));
			assert.ok(isGeometryPrimitive(linestring));
			assert.ok(isGeometryPrimitive(polygon));
			assert.ok(
				isGeometryPrimitive({
					type: 'MultiPoint',
					coordinates: [[0, 0]],
				}),
			);
			assert.ok(
				isGeometryPrimitive({
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
				isGeometryPrimitive({
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
		});
		test('rejects GeometryCollection', () => {
			assert.ok(!isGeometryPrimitive(geometrycollection));
		});
		test('rejects container types', () => {
			assert.ok(!isGeometryPrimitive(feature));
			assert.ok(!isGeometryPrimitive(featurecollection));
		});
	});

	describe('isStrictGeometryPrimitive', () => {
		test('accepts in-range primitive geometries', () => {
			assert.ok(isStrictGeometryPrimitive(point));
			assert.ok(isStrictGeometryPrimitive(linestring));
			assert.ok(isStrictGeometryPrimitive(polygon));
		});
		test('rejects out-of-range coordinates', () => {
			assert.ok(
				!isStrictGeometryPrimitive({
					type: 'Point',
					coordinates: [-181, 0],
				}),
			);
		});
		test('rejects GeometryCollection', () => {
			assert.ok(!isStrictGeometryPrimitive(geometrycollection));
		});
	});
});

describe('Geometry', () => {
	describe('isGeometry', () => {
		test('accepts the six coordinate-bearing geometry types and GeometryCollection', () => {
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
