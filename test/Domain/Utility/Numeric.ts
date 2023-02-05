import test from 'tape';
import { each } from 'template-literal-each';
import * as Export from '../../../source/Domain/Utility/Numeric';
import { exported } from '../../helper/geometry';

exported('Domain/Utility/Numeric', Export, 'bounds');

const { bounds } = Export;

test('Domain/Utility/Numeric - bounds', (t) => {
	each`
		value                  | min     | max     | expect
		-----------------------|---------|---------|--------
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
		const rotate = bounds(min, max);
		t.equal(rotate(value), expect, `${value} within bounds ${min} and ${max} is ${expect}`);
	});

	t.end();
});
