import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { multilinestring, polygon } from '../../../../test/data/Shapes';
import { isMultiLineString, isMultiLineStringCoordinates, isStrictMultiLineString, isStrictMultiLineStringCoordinates } from './MultiLineString';

describe('isMultiLineStringCoordinates', () => {
	test('accepts an array of line strings', () => {
		assert.ok(isMultiLineStringCoordinates([[[0, 0], [1, 1]], [[2, 2], [3, 3]]]));
		assert.ok(isMultiLineStringCoordinates(multilinestring.coordinates));
	});
	test('also accepts polygon coordinates — structurally identical at this level', () => {
		// A polygon ring is an array of positions, the same as a line string.
		// The closed-ring constraint and winding direction are checked at the
		// Polygon geometry level, not at the coordinates level.
		assert.ok(isMultiLineStringCoordinates(polygon.coordinates));
	});
	test('rejects a single line string (unwrapped)', () => {
		assert.ok(!isMultiLineStringCoordinates([[0, 0], [1, 1]]));
	});
});

describe('isStrictMultiLineStringCoordinates', () => {
	test('rejects out-of-range positions', () => {
		assert.ok(!isStrictMultiLineStringCoordinates([[[-181, 0], [0, 0]]]));
	});
});

describe('isMultiLineString', () => {
	test('accepts a valid MultiLineString', () => {
		assert.ok(isMultiLineString({ type: 'MultiLineString', coordinates: [[[0, 0], [1, 1]]] }));
		assert.ok(isMultiLineString(multilinestring));
	});
	test('rejects other geometry types', () => {
		assert.ok(!isMultiLineString(polygon));
		assert.ok(!isMultiLineString({ type: 'MultiLineString' }));
	});
});

describe('isStrictMultiLineString', () => {
	test('rejects out-of-range coordinates', () => {
		assert.ok(!isStrictMultiLineString({ type: 'MultiLineString', coordinates: [[[-181, 0], [0, 0]]] }));
	});
});
