import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import { coordinates as HolySee } from '../../../../test/data/HolySee';
import { coordinates as Italy } from '../../../../test/data/Italy';
import { coordinates as SanMarino } from '../../../../test/data/SanMarino';
import type { Improbability } from '../../../../test/helper/spec';
import * as Export from './ExteriorRing';

const { isExteriorRing, isStrictExteriorRing } = Export;

describe('Domain/GeoJSON/Concept/ExteriorRing', () => {
	describe('isExteriorRing', () => {
		test('returns true for valid exterior rings', () => {
			each`
				input
				---
				${[[1, 0], [1, 1], [0, 1], [0, 0.5], [1, 0]]}
				${[[1, 0], [0, 0.5], [0, 1], [1, 1], [1, 0]]}
				${[[1, 0], [1, 1], [0, 1], [1, 0]]}
				${[[-181, -91], [0, -91], [0, 91], [-181, -91]]}
			`(({ input }: Improbability) => {
				assert.ok(
					isExteriorRing(input),
					`${JSON.stringify(input)} is an exterior ring`,
				);
			});
		});

		test('returns false for invalid exterior rings', () => {
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
					!isExteriorRing(input),
					`${JSON.stringify(input)} is not an exterior ring`,
				);
			});
		});

		test('accepts Italy polygon exterior rings', () => {
			assert.ok(Italy.every((polygon) => polygon.every(isExteriorRing)));
		});

		test('rejects SanMarino and HolySee coordinates', () => {
			assert.ok(!SanMarino.every(isExteriorRing));
			assert.ok(!HolySee.every(isExteriorRing));
		});
	});

	describe('isStrictExteriorRing', () => {
		test('returns true for counter-clockwise rings within valid range', () => {
			each`
				input
				---
				${[[1, 0], [1, 1], [0, 1], [0, 0.5], [1, 0]]}
				${[[1, 0], [1, 1], [0, 1], [1, 0]]}
			`(({ input }: Improbability) => {
				assert.ok(
					isStrictExteriorRing(input),
					`${JSON.stringify(input)} is a strict exterior ring`,
				);
			});
		});

		test('returns false for clockwise, invalid, or out-of-range rings', () => {
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
					!isStrictExteriorRing(input),
					`${JSON.stringify(input)} is not a strict exterior ring`,
				);
			});
		});

		test('OSM Italy exterior rings pass strict RFC 7946 validation', () => {
			for (const [exterior] of Italy) {
				assert.ok(isExteriorRing(exterior)); // valid ring ✓
				assert.ok(isStrictExteriorRing(exterior)); // CCW — passes RFC 7946 §3.1.6 ✓
			}
		});

		test('rejects SanMarino and HolySee coordinates', () => {
			assert.ok(!SanMarino.every(isStrictExteriorRing));
			assert.ok(!HolySee.every(isStrictExteriorRing));
		});
	});
});
