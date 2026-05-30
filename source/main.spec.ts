import assert from 'node:assert/strict';
import { test } from 'node:test';
import { distance, intersect, SimpleGeometryIterator } from './main';

test('main exports are callable', () => {
	assert.strictEqual(typeof intersect, 'function');
	assert.strictEqual(typeof distance, 'function');
	assert.strictEqual(typeof SimpleGeometryIterator, 'function');
});
