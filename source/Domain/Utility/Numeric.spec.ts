import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import { bounds } from './Numeric';

describe('Domain/Utility/Numeric', () => {
	describe('bounds', () => {
		test('rotates values into range', () => {
			each`
				value                  | min     | max     | expect
				-----------------------|---------|---------|---
				${1}                   | ${-1}   | ${1}    | ${1}
				${100}                 | ${-1}   | ${1}    | ${0}
				${1}                   | ${-1.5} | ${1.5}  | ${1}
				${1}                   | ${1.5}  | ${-1.5} | ${1}
				${5.911738872528076}   | ${-180} | ${180}  | ${5.911738872528076}
				${-354.0882611274719}  | ${-180} | ${180}  | ${5.911738872528076}
				${365.911738872528076} | ${-180} | ${180}  | ${5.911738872528076}
				${51.97496770044958}   | ${-90}  | ${90}   | ${51.97496770044958}
				${-128.02503229955042} | ${-90}  | ${90}   | ${51.97496770044958}
				${231.97496770044958}  | ${-90}  | ${90}   | ${51.97496770044958}
			`(({ value, min, max, expect }: any) => {
				assert.strictEqual(bounds(min, max)(value), expect, `${value} within [${min}, ${max}] is ${expect}`);
			});
		});
	});
});
