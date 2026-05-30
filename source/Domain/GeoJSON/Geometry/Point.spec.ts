import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { point, multipoint } from '../../../../test/data/Shapes';
import { isPoint, isPointCoordinates, isStrictPoint, isStrictPointCoordinates } from './Point';

describe('isPointCoordinates', () => {
	test('accepts a 2D position', () => {
		assert.ok(isPointCoordinates([0, 0]));
	});
	test('accepts a 3D position', () => {
		assert.ok(isPointCoordinates([0, 0, 100]));
	});
	test('rejects an array of positions', () => {
		assert.ok(!isPointCoordinates([[0, 0], [1, 1]]));
	});
	test('rejects non-finite values', () => {
		assert.ok(!isPointCoordinates([Infinity, 0]));
	});
});

describe('isStrictPointCoordinates', () => {
	test('accepts in-range lon/lat', () => {
		assert.ok(isStrictPointCoordinates([0, 0]));
		assert.ok(isStrictPointCoordinates([4.9, 52.3]));
	});
	test('rejects out-of-range longitude', () => {
		assert.ok(!isStrictPointCoordinates([-181, 0]));
		assert.ok(!isStrictPointCoordinates([181, 0]));
	});
	test('rejects out-of-range latitude', () => {
		assert.ok(!isStrictPointCoordinates([0, -91]));
		assert.ok(!isStrictPointCoordinates([0, 91]));
	});
});

describe('isPoint', () => {
	test('accepts a valid Point', () => {
		assert.ok(isPoint({ type: 'Point', coordinates: [0, 0] }));
		assert.ok(isPoint(point));
	});
	test('rejects other geometry types', () => {
		assert.ok(!isPoint(multipoint));
	});
	test('rejects objects with missing fields', () => {
		assert.ok(!isPoint({ type: 'Point' }));
		assert.ok(!isPoint({ coordinates: [0, 0] }));
	});
});

describe('isStrictPoint', () => {
	test('accepts in-range coordinates', () => {
		assert.ok(isStrictPoint({ type: 'Point', coordinates: [4.9, 52.3] }));
		assert.ok(isStrictPoint(point));
	});
	test('rejects out-of-range coordinates', () => {
		assert.ok(!isStrictPoint({ type: 'Point', coordinates: [-181, 0] }));
		assert.ok(!isStrictPoint({ type: 'Point', coordinates: [0, 91] }));
	});
});
