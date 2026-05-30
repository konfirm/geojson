import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import type { Improbability } from '../../../test/helper/spec';
import { bounds } from './Numeric';

const LON = 5.911738872528076;
const LON_MINUS_ONE_CYCLE = -354.0882611274719;
// biome-ignore lint/correctness/noPrecisionLoss: intentional — verifies rotation wraps correctly at >360°
const LON_PLUS_ONE_CYCLE = 365.911738872528076;
const LAT = 51.97496770044958;
const LAT_MINUS_ONE_CYCLE = -128.02503229955042;
const LAT_PLUS_ONE_CYCLE = 231.97496770044958;

describe('Domain/Utility/Numeric', () => {
	describe('bounds', () => {
		test('rotates values into range', () => {
			each`
				value                 | min     | max    | expect
				----------------------|---------|--------|---
				${1}                  | ${-1}   | ${1}   | ${1}
				${100}                | ${-1}   | ${1}   | ${0}
				${1}                  | ${-1.5} | ${1.5} | ${1}
				${1}                  | ${1.5}  | ${-1.5}| ${1}
				${LON}                | ${-180} | ${180} | ${LON}
				${LON_MINUS_ONE_CYCLE}| ${-180} | ${180} | ${LON}
				${LON_PLUS_ONE_CYCLE} | ${-180} | ${180} | ${LON}
				${LAT}                | ${-90}  | ${90}  | ${LAT}
				${LAT_MINUS_ONE_CYCLE}| ${-90}  | ${90}  | ${LAT}
				${LAT_PLUS_ONE_CYCLE} | ${-90}  | ${90}  | ${LAT}
			`(({ value, min, max, expect }: Improbability) => {
				assert.strictEqual(
					bounds(min, max)(value),
					expect,
					`${value} within [${min}, ${max}] is ${expect}`,
				);
			});
		});
	});
});
