import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import * as Export from './Altitude';

const { isAltitude, isStrictAltitude } = Export;

describe('Domain/GeoJSON/Concept/Altitude', () => {
	describe('isAltitude', () => {
		test('returns true for valid altitudes', () => {
			each`
				input
				---
				${0}
				${0.0000000001}
				${1_234_567}
				${-6_371_008.7714}
				${-6_378_137}
				${20_180_000}
				${20_180_000.1}
			`(({ input }: any) => {
				assert.ok(isAltitude(input), `${input} is valid altitude`);
			});
		});

		test('returns false for invalid altitudes', () => {
			each`
				input
				---
				${-Infinity}
				${Infinity}
				${NaN}
				${'1234'}
				${false}
				${true}
			`(({ input }: any) => {
				assert.ok(!isAltitude(input), `${input} is not valid altitude`);
			});
		});
	});

	describe('isStrictAltitude', () => {
		test('returns true for valid strict altitudes', () => {
			each`
				input
				---
				${0}
				${0.0000000001}
				${1_234_567}
				${-6_371_008.7714}
				${20_180_000}
			`(({ input }: any) => {
				assert.ok(isStrictAltitude(input), `${input} is valid strict altitude`);
			});
		});

		test('returns false for out-of-range or invalid values', () => {
			each`
				input
				---
				${-6_371_008.7715}
				${-6_378_137}
				${-6_378_137.1}
				${20_180_000.1}
				${-Infinity}
				${Infinity}
				${NaN}
				${'1234'}
				${false}
				${true}
			`(({ input }: any) => {
				assert.ok(!isStrictAltitude(input), `${input} is not valid strict altitude`);
			});
		});
	});
});
