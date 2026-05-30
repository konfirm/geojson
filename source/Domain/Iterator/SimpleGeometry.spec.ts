import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as Export from './SimpleGeometry';
import type { Point } from '../GeoJSON/Geometry/Point';
import type { MultiPoint } from '../GeoJSON/Geometry/MultiPoint';
import type { LineString } from '../GeoJSON/Geometry/LineString';
import type { MultiLineString } from '../GeoJSON/Geometry/MultiLineString';
import type { Polygon } from '../GeoJSON/Geometry/Polygon';
import type { MultiPolygon } from '../GeoJSON/Geometry/MultiPolygon';
import type { GeometryCollection } from '../GeoJSON/GeometryCollection';
import type { Feature } from '../GeoJSON/Feature';
import type { FeatureCollection } from '../GeoJSON/FeatureCollection';

const { SimpleGeometryIterator } = Export;

const point: Point = { type: 'Point', coordinates: [0, 0] };
const multipoint: MultiPoint = { type: 'MultiPoint', coordinates: [[1, 1], [2, 2]] };
const linestring: LineString = { type: 'LineString', coordinates: [[3, 3], [4, 4]] };
const multilinestring: MultiLineString = {
	type: 'MultiLineString',
	coordinates: [[[5, 5], [6, 6]], [[7, 7], [8, 8]], [[9, 9], [10, 10]]],
};
const polygon: Polygon = {
	type: 'Polygon',
	coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
};
const multipolygon: MultiPolygon = {
	type: 'MultiPolygon',
	coordinates: [
		[[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]],
		[[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
	],
};
const geometrycollection: GeometryCollection = { type: 'GeometryCollection', geometries: [point, multipoint] };
const feature: Feature = { type: 'Feature', properties: null, geometry: linestring };
const featurecollection: FeatureCollection = {
	type: 'FeatureCollection',
	features: [
		{ type: 'Feature', properties: null, geometry: multilinestring },
		{ type: 'Feature', properties: null, geometry: polygon },
		{ type: 'Feature', properties: null, geometry: multipolygon },
	],
};

describe('Domain/Iterator/SimpleGeometryIterator', () => {
	test('implements Symbol.iterator', () => {
		assert.ok(Symbol.iterator in new SimpleGeometryIterator(point));
	});

	test('Point with MultiPoint yields point then expanded multipoint', () => {
		const expected = [
			point,
			{ type: 'Point', coordinates: [1, 1] },
			{ type: 'Point', coordinates: [2, 2] },
		];
		assert.deepStrictEqual([...new SimpleGeometryIterator(point, multipoint)], expected);
	});

	test('MultiPoint with LineString yields expanded multipoint then linestring', () => {
		const expected = [
			{ type: 'Point', coordinates: [1, 1] },
			{ type: 'Point', coordinates: [2, 2] },
			linestring,
		];
		assert.deepStrictEqual([...new SimpleGeometryIterator(multipoint, linestring)], expected);
	});

	test('MultiPoint with MultiLineString yields expanded multipoint then expanded multilinestring', () => {
		const expected = [
			{ type: 'Point', coordinates: [1, 1] },
			{ type: 'Point', coordinates: [2, 2] },
			{ type: 'LineString', coordinates: [[5, 5], [6, 6]] },
			{ type: 'LineString', coordinates: [[7, 7], [8, 8]] },
			{ type: 'LineString', coordinates: [[9, 9], [10, 10]] },
		];
		assert.deepStrictEqual([...new SimpleGeometryIterator(multipoint, multilinestring)], expected);
	});

	test('MultiLineString with Polygon yields expanded multilinestring then polygon', () => {
		const expected = [
			{ type: 'LineString', coordinates: [[5, 5], [6, 6]] },
			{ type: 'LineString', coordinates: [[7, 7], [8, 8]] },
			{ type: 'LineString', coordinates: [[9, 9], [10, 10]] },
			polygon,
		];
		assert.deepStrictEqual([...new SimpleGeometryIterator(multilinestring, polygon)], expected);
	});

	test('Polygon with MultiPolygon yields polygon then expanded multipolygon', () => {
		const expected = [
			polygon,
			{ type: 'Polygon', coordinates: [[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]] },
			{
				type: 'Polygon',
				coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
			},
		];
		assert.deepStrictEqual([...new SimpleGeometryIterator(polygon, multipolygon)], expected);
	});

	test('Polygon with Feature yields polygon then feature geometry', () => {
		const expected = [polygon, linestring];
		assert.deepStrictEqual([...new SimpleGeometryIterator(polygon, feature)], expected);
	});

	test('GeometryCollection with FeatureCollection yields all simple geometries in order', () => {
		const expected = [
			point,
			{ type: 'Point', coordinates: [1, 1] },
			{ type: 'Point', coordinates: [2, 2] },
			{ type: 'LineString', coordinates: [[5, 5], [6, 6]] },
			{ type: 'LineString', coordinates: [[7, 7], [8, 8]] },
			{ type: 'LineString', coordinates: [[9, 9], [10, 10]] },
			polygon,
			{ type: 'Polygon', coordinates: [[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]] },
			{
				type: 'Polygon',
				coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
			},
		];
		assert.deepStrictEqual([...new SimpleGeometryIterator(geometrycollection, featurecollection)], expected);
	});
});
