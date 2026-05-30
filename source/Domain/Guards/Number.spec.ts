import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import type { Improbability } from '../../../test/helper/spec';
import { isNumberBetween, isNumberValue } from './Number';

describe('Domain/Guards/Number', () => {
	describe('isNumberValue', () => {
		test('returns true for finite numbers', () => {
			each`
				input
				---
				${123}
				${Number.MAX_SAFE_INTEGER}
				${Number.MIN_SAFE_INTEGER}
				${Number.MAX_VALUE}
				${Number.MIN_VALUE}
				${Math.PI}
				${-Math.PI}
			`(({ input }: Improbability) => {
				assert.ok(isNumberValue(input), `${input} is a number value`);
			});
		});

		test('returns false for non-finite or non-number values', () => {
			each`
				input
				---
				${Infinity}
				${-Infinity}
				${NaN}
				${'123'}
			`(({ input }: Improbability) => {
				assert.ok(
					!isNumberValue(input),
					`${input} is not a number value`,
				);
			});
		});
	});

	describe('isNumberBetween', () => {
		test('returns true for values within range', () => {
			each`
				input      | min    | max
				-----------|--------|---
				${1}       | ${0}   | ${2}
				${0}       | ${0}   | ${2}
				${Math.PI} | ${0}   | ${undefined}
				${0}       | ${-10} | ${10}
			`(({ input, min, max }: Improbability) => {
				assert.ok(
					isNumberBetween(min, max)(input),
					`${input} is between ${min} and ${max}`,
				);
			});
		});

		test('returns false for values outside range', () => {
			each`
				input       | min  | max
				------------|------|---
				${-1}       | ${0} | ${2}
				${Infinity} | ${0} | ${undefined}
			`(({ input, min, max }: Improbability) => {
				assert.ok(
					!isNumberBetween(min, max)(input),
					`${input} is not between ${min} and ${max}`,
				);
			});
		});
	});
});
