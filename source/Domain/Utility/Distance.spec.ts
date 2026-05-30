import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Feature, LineString, Point, Polygon } from '../../main';
import { distance } from './Distance';

const amsterdam: Feature = {
	type: 'Feature',
	properties: { name: 'Amsterdam Airport Schiphol' },
	geometry: { type: 'Point', coordinates: [4.763889, 52.308333] },
};
const jfk: Feature = {
	type: 'Feature',
	properties: { name: 'New York JFK' },
	geometry: { type: 'Point', coordinates: [-73.778889, 40.639722] },
};

describe('distance', () => {
	describe('formula variants', () => {
		test('defaults to cartesian', () => {
			assert.strictEqual(distance(amsterdam, jfk), distance(amsterdam, jfk, 'cartesian'));
		});
		test('haversine gives a shorter result than cartesian for real-world coordinates', () => {
			// cartesian treats lon/lat as a flat plane; haversine accounts for curvature
			assert.ok(distance(amsterdam, jfk, 'haversine') < distance(amsterdam, jfk, 'cartesian'));
		});
		test('vincenty is within 1% of haversine', () => {
			const h = distance(amsterdam, jfk, 'haversine');
			const v = distance(amsterdam, jfk, 'vincenty');
			assert.ok(Math.abs(h - v) / h < 0.01);
		});
	});

	describe('geometry types', () => {
		const origin: Point = { type: 'Point', coordinates: [0, 0] };

		test('point to itself is 0', () => {
			assert.strictEqual(distance(origin, origin), 0);
		});
		test('point to point is positive', () => {
			assert.ok(distance(origin, { type: 'Point', coordinates: [1, 1] }) > 0);
		});
		test('point inside polygon has distance 0', () => {
			const poly: Polygon = { type: 'Polygon', coordinates: [[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]] };
			assert.strictEqual(distance({ type: 'Point', coordinates: [1, 1] }, poly), 0);
		});
		test('returns Infinity for unhandled geometry types', () => {
			const unknown = { type: 'Impossible', coordinates: [0, 0] } as any;
			assert.strictEqual(distance(origin, unknown), Infinity);
		});
	});
});
