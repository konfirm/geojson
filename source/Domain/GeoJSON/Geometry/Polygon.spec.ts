import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
	linestring,
	multipolygon,
	polygon,
} from '../../../../test/data/Shapes';
import {
	isPolygon,
	isPolygonCoordinates,
	isStrictPolygon,
	isStrictPolygonCoordinates,
} from './Polygon';

describe('isPolygonCoordinates', () => {
	test('accepts a single closed ring with 4+ positions', () => {
		assert.ok(
			isPolygonCoordinates([
				[
					[0, 0],
					[1, 0],
					[1, 1],
					[0, 0],
				],
			]),
		);
	});
	test('accepts rings with a hole', () => {
		assert.ok(
			isPolygonCoordinates([
				[
					[0, 0],
					[3, 0],
					[3, 3],
					[0, 3],
					[0, 0],
				],
				[
					[1, 1],
					[2, 1],
					[2, 2],
					[1, 2],
					[1, 1],
				],
			]),
		);
	});
	test('rejects open rings', () => {
		assert.ok(
			!isPolygonCoordinates([
				[
					[0, 0],
					[1, 0],
					[1, 1],
				],
			]),
		); // not closed
	});
	test('rejects rings with fewer than 4 positions', () => {
		assert.ok(
			!isPolygonCoordinates([
				[
					[0, 0],
					[1, 0],
					[0, 0],
				],
			]),
		); // 3 points
	});
	test('rejects line string coordinates (not nested in a ring)', () => {
		assert.ok(!isPolygonCoordinates(linestring.coordinates));
	});
});

describe('isStrictPolygonCoordinates', () => {
	test('accepts rings with in-range positions', () => {
		assert.ok(
			isStrictPolygonCoordinates([
				[
					[0, 0],
					[1, 0],
					[1, 1],
					[0, 0],
				],
			]),
		);
		assert.ok(
			isStrictPolygonCoordinates([
				[
					[1, 0],
					[1, 1],
					[0, 1],
					[0, 0.5],
					[1, 0],
				],
			]),
		);
	});
	test('rejects out-of-range positions', () => {
		// strict = all positions must be within [-180,180] lon and [-90,90] lat
		assert.ok(
			!isStrictPolygonCoordinates([
				[
					[-181, 0],
					[-181, 1],
					[0, 1],
					[0, 0],
					[-181, 0],
				],
			]),
		);
	});
});

describe('isPolygon', () => {
	test('accepts a valid Polygon', () => {
		assert.ok(
			isPolygon({
				type: 'Polygon',
				coordinates: [
					[
						[0, 0],
						[1, 0],
						[1, 1],
						[0, 0],
					],
				],
			}),
		);
		assert.ok(isPolygon(polygon));
	});
	test('rejects other geometry types', () => {
		assert.ok(!isPolygon(multipolygon));
		assert.ok(!isPolygon({ type: 'Polygon' }));
	});
});

describe('isStrictPolygon', () => {
	test('accepts a real-world polygon with correct winding', () => {
		assert.ok(isStrictPolygon(polygon));
	});
	test('rejects CW exterior ring per RFC 7946 §3.1.6', () => {
		assert.ok(
			!isStrictPolygon({
				type: 'Polygon',
				coordinates: [
					[
						[1, 0],
						[0, 0.5],
						[0, 1],
						[1, 1],
						[1, 0],
					],
				],
			}),
		);
	});
});
