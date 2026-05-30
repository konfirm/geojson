import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { isGeometryObject } from './GeometryObject';

describe('isGeometryObject', () => {
	const isMyGeometry = isGeometryObject('MyType', (v) => Array.isArray(v));

	test('accepts an object with the expected type and valid coordinates', () => {
		assert.ok(isMyGeometry({ type: 'MyType', coordinates: [1, 2] }));
	});
	test('rejects a different type', () => {
		assert.ok(!isMyGeometry({ type: 'OtherType', coordinates: [1, 2] }));
	});
	test('rejects when the coordinates guard fails', () => {
		assert.ok(!isMyGeometry({ type: 'MyType', coordinates: 'invalid' }));
	});
	test('rejects when type is missing', () => {
		assert.ok(!isMyGeometry({ coordinates: [1, 2] }));
	});
});
