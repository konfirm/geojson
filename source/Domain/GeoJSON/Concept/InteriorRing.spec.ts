import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import { coordinates as HolySee } from '../../../../test/data/HolySee';
import { coordinates as Italy } from '../../../../test/data/Italy';
import { coordinates as SanMarino } from '../../../../test/data/SanMarino';
import type { Improbability } from '../../../../test/helper/spec';
import * as Export from './InteriorRing';

const { isInteriorRing, isStrictInteriorRing } = Export;

describe('Domain/GeoJSON/Concept/InteriorRing', () => {
	describe('isInteriorRing', () => {
		test('returns true for valid interior rings', () => {
			each`
				input
				---
				${[[1, 0], [1, 1], [0, 1], [0, 0.5], [1, 0]]}
				${[[1, 0], [0, 0.5], [0, 1], [1, 1], [1, 0]]}
				${[[1, 0], [1, 1], [0, 1], [1, 0]]}
				${[[-181, -91], [0, -91], [0, 91], [-181, -91]]}
			`(({ input }: Improbability) => {
				assert.ok(
					isInteriorRing(input),
					`${JSON.stringify(input)} is an interior ring`,
				);
			});
		});

		test('returns false for invalid interior rings', () => {
			each`
				input
				---
				${undefined}
				${null}
				${'[[1,0],[1,1],[0,1],[1,0]]'}
				${[[1, 0], [1, 1], [0, 1], [0, 0]]}
				${[[1, 0], [1, 1], [1, 0]]}
				${[[1, 0], [1, 0]]}
				${[[1, 0]]}
			`(({ input }: Improbability) => {
				assert.ok(
					!isInteriorRing(input),
					`${JSON.stringify(input)} is not an interior ring`,
				);
			});
		});

		test('accepts Italy polygon coordinates', () => {
			assert.ok(Italy.every((polygon) => polygon.every(isInteriorRing)));
		});

		test('rejects SanMarino and HolySee coordinates', () => {
			assert.ok(!SanMarino.every(isInteriorRing));
			assert.ok(!HolySee.every(isInteriorRing));
		});
	});

	describe('isStrictInteriorRing', () => {
		test('returns true for clockwise rings within valid range', () => {
			each`
				input
				---
				${[[1, 0], [1, 1], [0, 1], [0, 0.5], [1, 0]]}
				${[[1, 0], [1, 1], [0, 1], [1, 0]]}
			`(({ input }: Improbability) => {
				assert.ok(
					isStrictInteriorRing(input),
					`${JSON.stringify(input)} is a strict interior ring`,
				);
			});
		});

		test('returns false for counter-clockwise, invalid, or out-of-range rings', () => {
			each`
				input
				---
				${undefined}
				${null}
				${'[[1,0],[1,1],[0,1],[1,0]]'}
				${[[1, 0], [0, 0.5], [0, 1], [1, 1], [1, 0]]}
				${[[1, 0], [1, 1], [0, 1], [0, 0]]}
				${[[1, 0], [1, 1], [1, 0]]}
				${[[1, 0], [1, 0]]}
				${[[1, 0]]}
				${[[-181, -91], [0, -91], [0, 91], [-181, -91]]}
			`(({ input }: Improbability) => {
				assert.ok(
					!isStrictInteriorRing(input),
					`${JSON.stringify(input)} is not a strict interior ring`,
				);
			});
		});

		test('inner rings of Italy polygons are strict interior rings', () => {
			assert.ok(
				!Italy.every((polygon) => polygon.every(isStrictInteriorRing)),
			);
			assert.ok(
				Italy.every((polygon) => !isStrictInteriorRing(polygon[0])),
			);
			assert.ok(
				Italy.filter((polygon) => polygon.length > 1).every((polygon) =>
					polygon.slice(1).every(isStrictInteriorRing),
				),
			);
		});

		test('rejects SanMarino and HolySee coordinates', () => {
			assert.ok(!SanMarino.every(isStrictInteriorRing));
			assert.ok(!HolySee.every(isStrictInteriorRing));
		});
	});
});
