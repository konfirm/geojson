import test from 'tape';
import each from 'template-literal-each';
import * as Export from '../../../source/Domain/Guards/Number';

test('Domain/Guards/Number - exports', (t) => {
	const expect = [
		'isNumberValue',
		'isNumberBetween',
	];

	t.deepEqual(Object.keys(Export), expect, `exports ${expect.join(', ')}`);
	expect.forEach((key) => {
		t.equal(typeof Export[key], 'function', `${key} is a function`);
	});
	t.end();
});

const { isNumberValue, isNumberBetween } = Export;

test('Domain/Guards/Number - isNumberValue', (t) => {
	each`
		input                      | valid
		---------------------------|-------
		${123}                     | yes
		${Number.MAX_SAFE_INTEGER} | yes
		${Number.MIN_SAFE_INTEGER} | yes
		${Number.MAX_VALUE}        | yes
		${Number.MIN_VALUE}        | yes
		${Math.PI}                 | yes
		${-Math.PI}                | yes
		${Infinity}                | no
		${-Infinity}               | no
		${NaN}                     | no
		${'123'}                   | no
	`(({ input, valid }) => {
		t.equal(isNumberValue(input), valid === 'yes', `${input} isNumberValue ${valid}`);
	});

	t.end();
});

test('Domain/Guards/Number - isNumberBetween', (t) => {
	each`
		input        | min    | max          | valid
		-------------|--------|--------------|-------
		${1}         | ${0}   | ${2}         | yes
		${0}         | ${0}   | ${2}         | yes
		${-1}        | ${0}   | ${2}         | no
		${Infinity}  | ${0}   | ${undefined} | no
		${Math.PI}   | ${0}   | ${undefined} | yes
		${0}         | ${-10} | ${10}        | yes
	`(({ input, min, max, valid }: any) => {
		const between = isNumberBetween(min, max);

		t.equal(between(input), valid === 'yes', `${input} is ${valid === 'no' ? 'not ' : ''}between ${min} and ${max}`);
	});

	t.end();
});
