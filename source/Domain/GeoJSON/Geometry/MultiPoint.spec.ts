import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { multipoint, linestring, polygon } from '../../../../test/data/Shapes';
import { isMultiPoint, isMultiPointCoordinates, isStrictMultiPoint, isStrictMultiPointCoordinates } from './MultiPoint';

describe('isMultiPointCoordinates', () => {
	test('accepts an array of positions', () => {
		assert.ok(isMultiPointCoordinates([[0, 0], [1, 1], [2, 2]]));
		assert.ok(isMultiPointCoordinates(multipoint.coordinates));
	});
	test('shares structure with LineString coordinates', () => {
		// MultiPoint and LineString coordinates are structurally identical
		assert.ok(isMultiPointCoordinates(linestring.coordinates));
	});
	test('rejects a single position', () => {
		assert.ok(!isMultiPointCoordinates([0, 0]));
	});
	test('rejects polygon coordinates (rings are one level deeper)', () => {
		assert.ok(!isMultiPointCoordinates(polygon.coordinates));
	});
});

describe('isStrictMultiPointCoordinates', () => {
	test('rejects out-of-range positions', () => {
		assert.ok(!isStrictMultiPointCoordinates([[-181, 0], [0, 0]]));
		assert.ok(!isStrictMultiPointCoordinates([[0, 91], [0, 0]]));
	});
});

describe('isMultiPoint', () => {
	test('accepts a valid MultiPoint', () => {
		assert.ok(isMultiPoint({ type: 'MultiPoint', coordinates: [[0, 0], [1, 1]] }));
		assert.ok(isMultiPoint(multipoint));
	});
	test('rejects other geometry types', () => {
		assert.ok(!isMultiPoint(linestring));
		assert.ok(!isMultiPoint({ type: 'MultiPoint' }));
	});
});

describe('isStrictMultiPoint', () => {
	test('rejects out-of-range coordinates', () => {
		assert.ok(!isStrictMultiPoint({ type: 'MultiPoint', coordinates: [[-181, 0]] }));
	});
});
