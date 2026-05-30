import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { multipolygon, polygon } from '../../../../test/data/Shapes';
import {
	isMultiPolygon,
	isMultiPolygonCoordinates,
	isStrictMultiPolygon,
	isStrictMultiPolygonCoordinates,
} from './MultiPolygon';

describe('isMultiPolygonCoordinates', () => {
	test('accepts an array of polygon coordinate sets', () => {
		assert.ok(
			isMultiPolygonCoordinates([
				[
					[
						[0, 0],
						[1, 0],
						[1, 1],
						[0, 0],
					],
				],
				[
					[
						[2, 2],
						[3, 2],
						[3, 3],
						[2, 2],
					],
				],
			]),
		);
		assert.ok(isMultiPolygonCoordinates(multipolygon.coordinates));
	});
	test('rejects polygon coordinates (not wrapped in an extra array)', () => {
		assert.ok(!isMultiPolygonCoordinates(polygon.coordinates));
	});
});

describe('isStrictMultiPolygonCoordinates', () => {
	test('rejects out-of-range coordinates', () => {
		assert.ok(
			!isStrictMultiPolygonCoordinates([
				[
					[
						[-181, 0],
						[-181, 1],
						[0, 1],
						[0, 0],
						[-181, 0],
					],
				],
			]),
		);
	});
});

describe('isMultiPolygon', () => {
	test('accepts a valid MultiPolygon', () => {
		assert.ok(
			isMultiPolygon({
				type: 'MultiPolygon',
				coordinates: [
					[
						[
							[0, 0],
							[1, 0],
							[1, 1],
							[0, 0],
						],
					],
				],
			}),
		);
		assert.ok(isMultiPolygon(multipolygon));
	});
	test('rejects other geometry types', () => {
		assert.ok(!isMultiPolygon(polygon));
		assert.ok(!isMultiPolygon({ type: 'MultiPolygon' }));
	});
});

describe('isStrictMultiPolygon', () => {
	test('accepts a real-world multipolygon with correct winding', () => {
		assert.ok(isStrictMultiPolygon(multipolygon));
	});
});
