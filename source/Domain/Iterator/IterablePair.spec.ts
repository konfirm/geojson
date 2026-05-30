import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as Export from './IterablePair';
import { SimpleGeometryIterator } from './SimpleGeometry';
import type { Point } from '../GeoJSON/Geometry/Point';
import type { MultiPoint } from '../GeoJSON/Geometry/MultiPoint';
import type { LineString } from '../GeoJSON/Geometry/LineString';
import type { MultiLineString } from '../GeoJSON/Geometry/MultiLineString';
import type { Polygon } from '../GeoJSON/Geometry/Polygon';
import type { MultiPolygon } from '../GeoJSON/Geometry/MultiPolygon';
import type { GeometryCollection } from '../GeoJSON/GeometryCollection';
import type { Feature } from '../GeoJSON/Feature';
import type { FeatureCollection } from '../GeoJSON/FeatureCollection';

const { IterablePairIterator } = Export;

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

describe('Domain/Iterator/IterablePairIterator', () => {
	test('implements Symbol.iterator', () => {
		const iterator = new IterablePairIterator(
			new SimpleGeometryIterator(point),
			new SimpleGeometryIterator(multipoint),
		);
		assert.ok(Symbol.iterator in iterator);
	});

	test('Point with MultiPoint yields point paired with each multipoint element', () => {
		const expected = [
			[point, { type: 'Point', coordinates: [1, 1] }],
			[point, { type: 'Point', coordinates: [2, 2] }],
		];
		assert.deepStrictEqual(
			[...new IterablePairIterator(new SimpleGeometryIterator(point), new SimpleGeometryIterator(multipoint))],
			expected,
		);
	});

	test('MultiPoint with LineString yields each multipoint element paired with linestring', () => {
		const expected = [
			[{ type: 'Point', coordinates: [1, 1] }, linestring],
			[{ type: 'Point', coordinates: [2, 2] }, linestring],
		];
		assert.deepStrictEqual(
			[...new IterablePairIterator(new SimpleGeometryIterator(multipoint), new SimpleGeometryIterator(linestring))],
			expected,
		);
	});

	test('MultiPoint with MultiLineString yields all cross-product pairs', () => {
		const expected = [
			[{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[5, 5], [6, 6]] }],
			[{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[7, 7], [8, 8]] }],
			[{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[9, 9], [10, 10]] }],
			[{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[5, 5], [6, 6]] }],
			[{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[7, 7], [8, 8]] }],
			[{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[9, 9], [10, 10]] }],
		];
		assert.deepStrictEqual(
			[
				...new IterablePairIterator(
					new SimpleGeometryIterator(multipoint),
					new SimpleGeometryIterator(multilinestring),
				),
			],
			expected,
		);
	});

	test('MultiLineString with Polygon yields each linestring paired with polygon', () => {
		const expected = [
			[{ type: 'LineString', coordinates: [[5, 5], [6, 6]] }, polygon],
			[{ type: 'LineString', coordinates: [[7, 7], [8, 8]] }, polygon],
			[{ type: 'LineString', coordinates: [[9, 9], [10, 10]] }, polygon],
		];
		assert.deepStrictEqual(
			[
				...new IterablePairIterator(
					new SimpleGeometryIterator(multilinestring),
					new SimpleGeometryIterator(polygon),
				),
			],
			expected,
		);
	});

	test('Polygon with MultiPolygon yields polygon paired with each expanded polygon', () => {
		const expected = [
			[polygon, { type: 'Polygon', coordinates: [[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]] }],
			[
				polygon,
				{
					type: 'Polygon',
					coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
				},
			],
		];
		assert.deepStrictEqual(
			[
				...new IterablePairIterator(
					new SimpleGeometryIterator(polygon),
					new SimpleGeometryIterator(multipolygon),
				),
			],
			expected,
		);
	});

	test('Polygon with Feature yields polygon paired with feature geometry', () => {
		const expected = [[polygon, linestring]];
		assert.deepStrictEqual(
			[...new IterablePairIterator(new SimpleGeometryIterator(polygon), new SimpleGeometryIterator(feature))],
			expected,
		);
	});

	test('GeometryCollection with FeatureCollection yields all cross-product pairs', () => {
		const expected = [
			[point, { type: 'LineString', coordinates: [[5, 5], [6, 6]] }],
			[point, { type: 'LineString', coordinates: [[7, 7], [8, 8]] }],
			[point, { type: 'LineString', coordinates: [[9, 9], [10, 10]] }],
			[point, polygon],
			[point, { type: 'Polygon', coordinates: [[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]] }],
			[
				point,
				{
					type: 'Polygon',
					coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
				},
			],
			[{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[5, 5], [6, 6]] }],
			[{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[7, 7], [8, 8]] }],
			[{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[9, 9], [10, 10]] }],
			[{ type: 'Point', coordinates: [1, 1] }, polygon],
			[
				{ type: 'Point', coordinates: [1, 1] },
				{ type: 'Polygon', coordinates: [[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]] },
			],
			[
				{ type: 'Point', coordinates: [1, 1] },
				{
					type: 'Polygon',
					coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
				},
			],
			[{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[5, 5], [6, 6]] }],
			[{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[7, 7], [8, 8]] }],
			[{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[9, 9], [10, 10]] }],
			[{ type: 'Point', coordinates: [2, 2] }, polygon],
			[
				{ type: 'Point', coordinates: [2, 2] },
				{ type: 'Polygon', coordinates: [[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]] },
			],
			[
				{ type: 'Point', coordinates: [2, 2] },
				{
					type: 'Polygon',
					coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
				},
			],
		];
		assert.deepStrictEqual(
			[
				...new IterablePairIterator(
					new SimpleGeometryIterator(geometrycollection),
					new SimpleGeometryIterator(featurecollection),
				),
			],
			expected,
		);
	});
});
