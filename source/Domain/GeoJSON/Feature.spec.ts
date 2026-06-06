import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { isNULL } from '@konfirm/guard';
import { feature, point, polygon } from '../../../test/data/Shapes';
import { isFeature, isStrictFeature } from './Feature';
import { isPoint, isStrictPoint } from './Geometry/Point';
import { isPolygon } from './Geometry/Polygon';

describe('isFeature', () => {
	test('accepts a Feature with geometry', () => {
		assert.ok(
			isFeature({
				type: 'Feature',
				properties: null,
				geometry: { type: 'Point', coordinates: [0, 0] },
			}),
		);
		assert.ok(isFeature(feature));
	});

	test('rejects non-Feature shapes', () => {
		assert.ok(!isFeature(point));
		assert.ok(!isFeature(polygon));
	});
	test('rejects objects with missing fields', () => {
		assert.ok(!isFeature({ type: 'Feature' }));
		assert.ok(!isFeature({ type: 'Feature', geometry: null })); // missing properties
	});
});

describe('isStrictFeature', () => {
	test('accepts a Feature with strict geometry', () => {
		assert.ok(isStrictFeature(feature));
	});
	test('rejects a Feature with out-of-range geometry', () => {
		assert.ok(
			!isStrictFeature({
				type: 'Feature',
				properties: null,
				geometry: { type: 'Point', coordinates: [-181, 0] },
			}),
		);
	});
});

describe('isFeature with geometry guard', () => {
	const unlocated = { type: 'Feature', properties: null, geometry: null };
	const polygonFeature = {
		type: 'Feature',
		properties: null,
		geometry: polygon,
	};

	test('accepts a Feature whose geometry matches the guard', () => {
		assert.ok(isFeature(feature, isPoint));
	});
	test('rejects a Feature whose geometry does not match the guard', () => {
		assert.ok(!isFeature(polygonFeature, isPoint));
		assert.ok(!isFeature(feature, isPolygon));
	});
	test('accepts an unlocated Feature when null is guarded', () => {
		assert.ok(isFeature(unlocated, isNULL));
	});
	test('rejects an unlocated Feature when null is not in the guard', () => {
		assert.ok(!isFeature(unlocated, isPoint));
	});
});

describe('isStrictFeature with geometry guard', () => {
	const outOfRange = {
		type: 'Feature',
		properties: null,
		geometry: { type: 'Point', coordinates: [-181, 0] },
	};

	test('accepts a Feature whose geometry matches the strict guard', () => {
		assert.ok(isStrictFeature(feature, isStrictPoint));
	});
	test('rejects a Feature whose geometry fails the strict guard', () => {
		assert.ok(!isStrictFeature(outOfRange, isStrictPoint));
	});
});
