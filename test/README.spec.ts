import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Feature, FeatureCollection, GeometryCollection, LineString, MultiLineString, MultiPoint, Point } from '../source/main';
import { distance, intersect, SimpleGeometryIterator } from '../source/main';

describe('README - intersect', () => {
	test('point intersects polygon feature', () => {
		const point: Point = { type: 'Point', coordinates: [1, 1] };
		const feature: Feature = {
			type: 'Feature',
			properties: { name: 'triangle' },
			geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 2], [2, 1], [0, 0]]] },
		};
		assert.ok(intersect(point, feature));
		assert.ok(intersect(feature, point));
	});
});

describe('README - distance', () => {
	const ams: Feature = {
		type: 'Feature',
		properties: { name: 'Amsterdam Airport Schiphol' },
		geometry: { type: 'Point', coordinates: [4.763889, 52.308333] },
	};
	const jfk: Feature = {
		type: 'Feature',
		properties: { name: 'New York John F. Kennedy International Airport' },
		geometry: { type: 'Point', coordinates: [-73.778889, 40.639722] },
	};

	test('cartesian (default)', () => {
		assert.strictEqual(distance(ams, jfk), 8829424.604594177);
		assert.strictEqual(distance(ams, jfk, 'cartesian'), 8829424.604594177);
	});
	test('haversine', () => {
		assert.strictEqual(distance(ams, jfk, 'haversine'), 5847546.425707642);
	});
	test('vincenty', () => {
		assert.strictEqual(distance(ams, jfk, 'vincenty'), 5863355.371234315);
	});
});

describe('README - SimpleGeometryIterator', () => {
	test('flattens mixed GeoJSON types into simple geometries in order', () => {
		const point: Point = { type: 'Point', coordinates: [5.903949737548828, 51.991936460056515] };
		const multipoint: MultiPoint = {
			type: 'MultiPoint',
			coordinates: [
				[5.896482467651367, 52.00039200820837],
				[5.888843536376953, 51.99912377779024],
			],
		};
		const linestring: LineString = {
			type: 'LineString',
			coordinates: [
				[5.9077370166778564, 51.9944435645134],
				[5.90764045715332, 51.994209045542206],
				[5.907415151596069, 51.99408683094357],
			],
		};
		const multilinestring: MultiLineString = {
			type: 'MultiLineString',
			coordinates: [
				[
					[5.905205011367797, 51.99430813821511],
					[5.905086994171143, 51.994261894995034],
					[5.905033349990845, 51.99414958983319],
					[5.9051138162612915, 51.994116558849626],
				],
				[
					[5.904818773269653, 51.993825885143515],
					[5.905521512031555, 51.993551725259614],
					[5.905789732933044, 51.99358805979856],
				],
			],
		};
		const geometrycollection: GeometryCollection = { type: 'GeometryCollection', geometries: [point] };
		const featurecollection: FeatureCollection = {
			type: 'FeatureCollection',
			features: [
				{ type: 'Feature', properties: {}, geometry: linestring },
				{ type: 'Feature', properties: {}, geometry: multilinestring },
			],
		};

		const expected = ([] as unknown[])
			.concat(multipoint.coordinates.map((coordinates) => ({ type: 'Point', coordinates })))
			.concat(point)
			.concat(linestring)
			.concat(multilinestring.coordinates.map((coordinates) => ({ type: 'LineString', coordinates })));

		assert.deepStrictEqual(
			[...new SimpleGeometryIterator(multipoint, geometrycollection, featurecollection)],
			expected,
		);
	});
});
