import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { isBoolean, isNumber, isString } from '@konfirm/guard';
import { isTuple } from './Tuple';

describe('Domain/Guards/Tuple', () => {
	describe('isTuple', () => {
		const snn = isTuple(isString, isNumber, isNumber);
		const bsn = isTuple(isBoolean, isString, isNumber);

		test('returns true for matching tuples', () => {
			assert.ok(
				snn(['abc', 123, 456]),
				"['abc', 123, 456] matches isTuple(isString, isNumber, isNumber)",
			);
			assert.ok(
				bsn([true, 'abc', 123]),
				"[true, 'abc', 123] matches isTuple(isBoolean, isString, isNumber)",
			);
			assert.ok(
				bsn([false, 'abc', 123]),
				"[false, 'abc', 123] matches isTuple(isBoolean, isString, isNumber)",
			);
		});

		test('returns false for non-matching tuples', () => {
			assert.ok(
				!snn(['abc']),
				"['abc'] does not match isTuple(isString, isNumber, isNumber)",
			);
			assert.ok(
				!snn(['abc', 123]),
				"['abc', 123] does not match isTuple(isString, isNumber, isNumber)",
			);
			assert.ok(
				!snn(['abc', 123, true]),
				"['abc', 123, true] does not match isTuple(isString, isNumber, isNumber)",
			);
			assert.ok(
				!snn(['abc', false, 123]),
				"['abc', false, 123] does not match isTuple(isString, isNumber, isNumber)",
			);
			assert.ok(
				!snn(['abc', 123, 456, 789]),
				"['abc', 123, 456, 789] does not match isTuple(isString, isNumber, isNumber)",
			);
			assert.ok(
				!bsn(['abc', 123]),
				"['abc', 123] does not match isTuple(isBoolean, isString, isNumber)",
			);
			assert.ok(
				!bsn(['abc', false, 123]),
				"['abc', false, 123] does not match isTuple(isBoolean, isString, isNumber)",
			);
		});
	});
});
