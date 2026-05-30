import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { GeoJSON } from '../../../source/main';
import { intersect } from '../../../source/Domain/Utility/Intersect';
import { explain } from '../../helper/spec';
import { shapes } from '../../data/Intersect';

const types = [
	'Point', 'MultiPoint', 'LineString', 'MultiLineString',
	'Polygon', 'MultiPolygon', 'GeometryCollection', 'Feature', 'FeatureCollection',
];

type Shape = { a: GeoJSON; b: GeoJSON; intersect: boolean };

describe('Intersect — all geometry type combinations', () => {
	for (const ta of types) {
		for (const tb of types) {
			const pairs = (shapes as Shape[]).reduce((acc: Shape[], s) => {
				if (s.a.type === ta && s.b.type === tb) return [...acc, s];
				if (s.a.type === tb && s.b.type === ta) return [...acc, { a: s.b, b: s.a, intersect: s.intersect }];
				return acc;
			}, []);

			if (pairs.length === 0) continue;

			const hits = pairs.filter((s) => s.intersect);
			const miss = pairs.filter((s) => !s.intersect);

			if (hits.length) {
				test(`${ta} ∩ ${tb} — intersecting pairs`, () => {
					for (const { a, b } of hits) {
						assert.ok(intersect(a, b), `${explain(a)} ∩ ${explain(b)}`);
					}
				});
			}
			if (miss.length) {
				test(`${ta} ∩ ${tb} — non-intersecting pairs`, () => {
					for (const { a, b } of miss) {
						assert.ok(!intersect(a, b), `${explain(a)} ∦ ${explain(b)}`);
					}
				});
			}
		}
	}

	test('invalid GeoJSON types do not intersect', () => {
		for (const s of (shapes as any[]).filter((s) => s.a.type === 'Impossible' || s.b.type === 'Impossible')) {
			assert.ok(!intersect(s.a, s.b), `${explain(s.a)} ∦ ${explain(s.b)}`);
		}
	});
});
