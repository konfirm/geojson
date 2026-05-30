import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import * as Export from './LinearRing';
import { coordinates as Italy } from '../../../../test/data/Italy';
import { coordinates as SanMarino } from '../../../../test/data/SanMarino';
import { coordinates as HolySee } from '../../../../test/data/HolySee';

const { isLinearRing, isStrictLinearRing } = Export;

describe('Domain/GeoJSON/Concept/LinearRing', () => {
	describe('isLinearRing', () => {
		test('returns true for valid linear rings', () => {
			each`
				input
				---
				${[[1, 0], [1, 1], [0, 1], [0, 0.5], [1, 0]]}
				${[[1, 0], [0, 0.5], [0, 1], [1, 1], [1, 0]]}
				${[[1, 0], [1, 1], [0, 1], [1, 0]]}
				${[[-181, -91], [0, -91], [0, 91], [-181, -91]]}
			`(({ input }: any) => {
				assert.ok(isLinearRing(input), `${JSON.stringify(input)} is a linear ring`);
			});
		});

		test('returns false for invalid linear rings', () => {
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
			`(({ input }: any) => {
				assert.ok(!isLinearRing(input), `${JSON.stringify(input)} is not a linear ring`);
			});
		});

		test('accepts Italy polygon coordinates', () => {
			assert.ok(Italy.every((polygon) => polygon.every(isLinearRing)));
		});

		test('rejects SanMarino and HolySee coordinates', () => {
			assert.ok(!SanMarino.every(isLinearRing));
			assert.ok(!HolySee.every(isLinearRing));
		});
	});

	describe('isStrictLinearRing', () => {
		test('returns true for valid strict linear rings', () => {
			each`
				input
				---
				${[[1, 0], [1, 1], [0, 1], [0, 0.5], [1, 0]]}
				${[[1, 0], [0, 0.5], [0, 1], [1, 1], [1, 0]]}
				${[[1, 0], [1, 1], [0, 1], [1, 0]]}
			`(({ input }: any) => {
				assert.ok(isStrictLinearRing(input), `${JSON.stringify(input)} is a strict linear ring`);
			});
		});

		test('returns false for out-of-range or invalid linear rings', () => {
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
				${[[-181, -91], [0, -91], [0, 91], [-181, -91]]}
			`(({ input }: any) => {
				assert.ok(!isStrictLinearRing(input), `${JSON.stringify(input)} is not a strict linear ring`);
			});
		});

		test('accepts Italy polygon coordinates', () => {
			assert.ok(Italy.every((polygon) => polygon.every(isStrictLinearRing)));
		});

		test('rejects SanMarino and HolySee coordinates', () => {
			assert.ok(!SanMarino.every(isStrictLinearRing));
			assert.ok(!HolySee.every(isStrictLinearRing));
		});
	});
});
