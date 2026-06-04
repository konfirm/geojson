import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as Main from './main';

const expectedExports = [
	'SimpleGeometryIterator',
	'distance',
	'cartesian',
	'haversine',
	'karney',
	'vincenty',
	'intersect',
	'isFeature',
	'isFeatureCollection',
	'isGeoJSON',
	'isGeometry',
	'isGeometryCollection',
	'isGeometryPrimitive',
	'isLineString',
	'isMultiLineString',
	'isMultiPoint',
	'isMultiPolygon',
	'isPoint',
	'isPolygon',
	'isPosition',
	'isStrictFeature',
	'isStrictFeatureCollection',
	'isStrictGeoJSON',
	'isStrictGeometry',
	'isStrictGeometryCollection',
	'isStrictGeometryPrimitive',
	'isStrictLineString',
	'isStrictMultiLineString',
	'isStrictMultiPoint',
	'isStrictMultiPolygon',
	'isStrictPoint',
	'isStrictPolygon',
	'isStrictPosition',
].sort();

describe('main', () => {
	test('exports exactly the intended public API', () => {
		// type-only exports are erased at runtime; filter to value exports only
		const actual = Object.keys(Main)
			.filter((k) => (Main as Record<string, unknown>)[k] !== undefined)
			.sort();

		assert.deepStrictEqual(actual, expectedExports);
	});

	test('every value export is a function or class', () => {
		for (const key of expectedExports) {
			assert.strictEqual(
				typeof (Main as Record<string, unknown>)[key],
				'function',
				`${key} should be a function`,
			);
		}
	});
});
