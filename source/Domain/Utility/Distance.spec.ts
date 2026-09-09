import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Improbability } from '../../../test/helper/spec';
import type { Feature, LineString, Point, Polygon } from '../../main';
import { EARTH_RADIUS } from '../Constants';
import { cartesian, distance, haversine, karney, vincenty } from './Distance';

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
		test('defaults to haversine', () => {
			assert.strictEqual(
				distance(amsterdam, jfk),
				distance(amsterdam, jfk, 'haversine'),
			);
		});
		test('haversine gives a shorter result than cartesian for real-world coordinates', () => {
			// cartesian treats lon/lat as a flat plane; haversine accounts for curvature
			assert.ok(
				distance(amsterdam, jfk, 'haversine') <
					distance(amsterdam, jfk, 'cartesian'),
			);
		});
		test('vincenty is within 1% of haversine', () => {
			const h = distance(amsterdam, jfk, 'haversine');
			const v = distance(amsterdam, jfk, 'vincenty');
			assert.ok(Math.abs(h - v) / h < 0.01);
		});
	});

	describe('formula functions', () => {
		test('cartesian matches distance with cartesian formula', () => {
			assert.strictEqual(
				cartesian(amsterdam, jfk),
				distance(amsterdam, jfk, 'cartesian'),
			);
		});
		test('haversine matches distance with haversine formula', () => {
			assert.strictEqual(
				haversine(amsterdam, jfk),
				distance(amsterdam, jfk, 'haversine'),
			);
		});
		test('vincenty matches distance with vincenty formula', () => {
			assert.strictEqual(
				vincenty(amsterdam, jfk),
				distance(amsterdam, jfk, 'vincenty'),
			);
		});
		test('karney matches distance with karney formula', () => {
			assert.strictEqual(
				karney(amsterdam, jfk),
				distance(amsterdam, jfk, 'karney'),
			);
		});
	});

	describe('radius parameter', () => {
		test('cartesian: defaults to EARTH_RADIUS', () => {
			assert.strictEqual(
				cartesian(amsterdam, jfk, EARTH_RADIUS),
				cartesian(amsterdam, jfk),
			);
		});
		test('haversine: defaults to EARTH_RADIUS', () => {
			assert.strictEqual(
				haversine(amsterdam, jfk, EARTH_RADIUS),
				haversine(amsterdam, jfk),
			);
		});
		test('cartesian: 180/π cancels the internal degrees→radians step, giving the raw planar Euclidean distance', () => {
			const [λa, φa] = (<Point>amsterdam.geometry).coordinates;
			const [λb, φb] = (<Point>jfk.geometry).coordinates;

			assert.strictEqual(
				cartesian(amsterdam, jfk, 180 / Math.PI),
				Math.sqrt((λb - λa) ** 2 + (φb - φa) ** 2),
			);
		});
		test('haversine: radius of 1 gives the raw angular separation in radians', () => {
			const radians = haversine(amsterdam, jfk, 1);

			assert.strictEqual(
				haversine(amsterdam, jfk, 6_378_100),
				radians * 6_378_100,
			);
		});
		test("haversine: 6,378,100 matches MongoDB's hardcoded sphere radius for antipodal points", () => {
			// MongoDB's own $nearSphere/2dsphere distance for exact antipodes is
			// 20037392.10386106 m, i.e. a plain sphere of radius 6378100 (not WGS84)
			const a: Point = { type: 'Point', coordinates: [0, 0] };
			const b: Point = { type: 'Point', coordinates: [180, 0] };

			assert.strictEqual(
				haversine(a, b, 6_378_100),
				20_037_392.103_861_06,
			);
		});
	});

	describe('geometry types', () => {
		const origin: Point = { type: 'Point', coordinates: [0, 0] };

		test('point to itself is 0', () => {
			assert.strictEqual(distance(origin, origin), 0);
		});
		test('point to point is positive', () => {
			assert.ok(
				distance(origin, { type: 'Point', coordinates: [1, 1] }) > 0,
			);
		});
		test('point inside polygon has distance 0', () => {
			const poly: Polygon = {
				type: 'Polygon',
				coordinates: [
					[
						[0, 0],
						[0, 2],
						[2, 2],
						[2, 0],
						[0, 0],
					],
				],
			};
			assert.strictEqual(
				distance({ type: 'Point', coordinates: [1, 1] }, poly),
				0,
			);
		});
		test('returns Infinity for unhandled geometry types', () => {
			const unknown = {
				type: 'Impossible',
				coordinates: [0, 0],
			} as Improbability;
			assert.strictEqual(distance(origin, unknown), Infinity);
		});
	});

	describe('geometry crossing the antimeridian', () => {
		test('does not collapse to 0 for lines that only appear to cross on raw coordinates', () => {
			// a short hop across the dateline; b sits at lon=0, nowhere near it
			const a: LineString = {
				type: 'LineString',
				coordinates: [
					[179, -1],
					[-179, 1],
				],
			};
			const b: LineString = {
				type: 'LineString',
				coordinates: [
					[0, -1],
					[0, 1],
				],
			};
			assert.ok(distance(a, b) > 1_000_000);
			assert.ok(distance(b, a) > 1_000_000);
		});

		test('reports the true short gap between lines hugging opposite sides of the dateline', () => {
			const a: LineString = {
				type: 'LineString',
				coordinates: [
					[179, 0],
					[179, 1],
				],
			};
			const b: LineString = {
				type: 'LineString',
				coordinates: [
					[-179, 0],
					[-179, 1],
				],
			};
			const d = distance(a, b);
			assert.ok(d > 200_000 && d < 250_000, `expected ~222km, got ${d}`);
		});

		test('point inside a dateline-straddling polygon has distance 0', () => {
			const poly: Polygon = {
				type: 'Polygon',
				coordinates: [
					[
						[179, 0],
						[-179, 0],
						[-179, 2],
						[179, 2],
						[179, 0],
					],
				],
			};
			assert.strictEqual(
				distance({ type: 'Point', coordinates: [180, 1] }, poly),
				0,
			);
		});
	});
});
