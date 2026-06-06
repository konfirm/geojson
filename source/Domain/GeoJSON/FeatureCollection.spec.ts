import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
	feature,
	featurecollection,
	point,
	polygon,
} from '../../../test/data/Shapes';
import {
	isFeatureCollection,
	isStrictFeatureCollection,
} from './FeatureCollection';
import { isPoint } from './Geometry/Point';
import { isStrictPolygon } from './Geometry/Polygon';

describe('isFeatureCollection', () => {
	test('accepts a FeatureCollection', () => {
		assert.ok(
			isFeatureCollection({ type: 'FeatureCollection', features: [] }),
		);
		assert.ok(isFeatureCollection(featurecollection));
	});
	test('rejects non-FeatureCollection shapes', () => {
		assert.ok(!isFeatureCollection(feature));
		assert.ok(!isFeatureCollection(point));
	});
	test('rejects objects with missing fields', () => {
		assert.ok(!isFeatureCollection({ type: 'FeatureCollection' }));
	});
});

describe('isStrictFeatureCollection', () => {
	test('accepts a FeatureCollection with strict geometries', () => {
		assert.ok(isStrictFeatureCollection(featurecollection));
	});
	test('rejects a FeatureCollection with out-of-range geometry', () => {
		assert.ok(
			!isStrictFeatureCollection({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						properties: null,
						geometry: { type: 'Point', coordinates: [-181, 0] },
					},
				],
			}),
		);
	});
});

describe('isFeatureCollection with geometry guard', () => {
	const pointCollection = {
		type: 'FeatureCollection',
		features: [
			{ type: 'Feature', properties: null, geometry: point },
			{
				type: 'Feature',
				properties: null,
				geometry: { type: 'Point', coordinates: [0, 0] },
			},
		],
	};
	const mixedCollection = {
		type: 'FeatureCollection',
		features: [
			{ type: 'Feature', properties: null, geometry: point },
			{ type: 'Feature', properties: null, geometry: polygon },
		],
	};

	test('accepts a FeatureCollection where all features match the guard', () => {
		assert.ok(isFeatureCollection(pointCollection, isPoint));
	});
	test('rejects a FeatureCollection where any feature does not match the guard', () => {
		assert.ok(!isFeatureCollection(mixedCollection, isPoint));
	});
	test('accepts an empty FeatureCollection with any guard', () => {
		assert.ok(
			isFeatureCollection(
				{ type: 'FeatureCollection', features: [] },
				isPoint,
			),
		);
	});
});

describe('isStrictFeatureCollection with geometry guard', () => {
	const strictPolygonCollection = {
		type: 'FeatureCollection',
		features: [{ type: 'Feature', properties: null, geometry: polygon }],
	};
	const outOfRangeCollection = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				properties: null,
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[0, 0],
							[181, 0],
							[181, 1],
							[0, 0],
						],
					],
				},
			},
		],
	};

	test('accepts a FeatureCollection where all features match the strict guard', () => {
		assert.ok(
			isStrictFeatureCollection(strictPolygonCollection, isStrictPolygon),
		);
	});
	test('rejects a FeatureCollection where any feature fails the strict guard', () => {
		assert.ok(
			!isStrictFeatureCollection(outOfRangeCollection, isStrictPolygon),
		);
	});
});
