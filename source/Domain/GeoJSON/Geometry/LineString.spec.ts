import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { linestring, multipoint, polygon } from '../../../../test/data/Shapes';
import { isLineString, isLineStringCoordinates, isStrictLineString, isStrictLineStringCoordinates } from './LineString';

describe('isLineStringCoordinates', () => {
	test('accepts an array of positions', () => {
		assert.ok(isLineStringCoordinates([[0, 0], [1, 1], [2, 2]]));
		assert.ok(isLineStringCoordinates(linestring.coordinates));
	});
	test('shares structure with MultiPoint coordinates', () => {
		// LineString and MultiPoint coordinates are structurally identical
		assert.ok(isLineStringCoordinates(multipoint.coordinates));
	});
	test('rejects a single position', () => {
		assert.ok(!isLineStringCoordinates([0, 0]));
	});
	test('rejects polygon coordinates (rings are one level deeper)', () => {
		assert.ok(!isLineStringCoordinates(polygon.coordinates));
	});
});

describe('isStrictLineStringCoordinates', () => {
	test('rejects out-of-range positions', () => {
		assert.ok(!isStrictLineStringCoordinates([[-181, 0], [0, 0]]));
	});
});

describe('isLineString', () => {
	test('accepts a valid LineString', () => {
		assert.ok(isLineString({ type: 'LineString', coordinates: [[0, 0], [1, 1]] }));
		assert.ok(isLineString(linestring));
	});
	test('rejects other geometry types', () => {
		assert.ok(!isLineString(multipoint));
		assert.ok(!isLineString({ type: 'LineString' }));
	});
});

describe('isStrictLineString', () => {
	test('rejects out-of-range coordinates', () => {
		assert.ok(!isStrictLineString({ type: 'LineString', coordinates: [[-181, 0], [0, 0]] }));
	});
});
