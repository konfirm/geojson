import { isBoolean, isNumber, isString } from '@konfirm/guard';
import test from 'tape';
import * as Export from '../../../source/Domain/Guards/Tuple';
import { exported } from '../../helper/geometry';

exported('Domain/Guards/Tuple - exports', Export, 'isTuple');

const { isTuple } = Export;

test('Domain/Guards/Tuple - isTuple', (t) => {
	const snn = isTuple(isString, isNumber, isNumber);
	const bsn = isTuple(isBoolean, isString, isNumber);

	t.notOk(snn(['abc']), `['abc'] does not match isTuple(isString, isNumber, isNumber)`);
	t.notOk(snn(['abc', 123]), `['abc', 123] does not match isTuple(isString, isNumber, isNumber)`);
	t.ok(snn(['abc', 123, 456]), `['abc', 123, 456] matches isTuple(isString, isNumber, isNumber)`);
	t.notOk(snn(['abc', 123, true]), `['abc', 123, true] does not match isTuple(isString, isNumber, isNumber)`);
	t.notOk(snn(['abc', false, 123]), `['abc', false, 123] does not match isTuple(isString, isNumber, isNumber)`);
	t.notOk(snn(['abc', 123, 456, 789]), `['abc', 456, 789, 123] does not match isTuple(isString, isNumber, isNumber)`);

	t.notOk(bsn(['abc', 123]), `['abc', 123] does not match isTuple(isBoolean, isString, isNumber)`);
	t.notOk(bsn(['abc', false, 123]), `['abc', false, 123] does not match isTuple(isBoolean, isString, isNumber)`);
	t.ok(bsn([true, 'abc', 123]), `[true, 'abc', 123] matches isTuple(isBoolean, isString, isNumber)`);
	t.ok(bsn([false, 'abc', 123]), `[false, 'abc', 123] matches isTuple(isBoolean, isString, isNumber)`);

	t.end();
});
