import test from 'tape';
import each from 'template-literal-each';
import * as Export from '../../../../source/Domain/GeoJSON/Concept/Longitude';
import { exported } from '../../../helper/geometry';

exported('Domain/GeoJSON/Concept/Longitude', Export, 'isLongitude', 'isStrictLongitude');

const { isLongitude, isStrictLongitude } = Export;

test('Domain/GeoJSON/Concept/Longitude - isLongitude', (t) => {
	each`
		input           | valid
		----------------|-------
		${0}            | yes
		${0.0000000001} | yes
		${5.8987296}    | yes
		${-180}         | yes
		${-180.1}       | yes
		${180}          | yes
		${180.1}        | yes
		${-Infinity}    | no
		${Infinity}     | no
		${NaN}          | no
		${'1234'}       | no
		${false}        | no
		${true}         | no
	`(({ input, valid }) => {
		t.equal(isLongitude(input), valid === 'yes', `${input} ${valid}`);
	});

	t.end();
});

test('Domain/GeoJSON/Concept/Longitude - isStrictLongitude', (t) => {
	each`
		input           | valid
		----------------|-------
		${0}            | yes
		${0.0000000001} | yes
		${5.8987296}    | yes
		${-180}         | yes
		${-180.1}       | no
		${180}          | yes
		${180.1}        | no
		${-Infinity}    | no
		${Infinity}     | no
		${NaN}          | no
		${'1234'}       | no
		${false}        | no
		${true}         | no
	`(({ input, valid }) => {
		t.equal(isStrictLongitude(input), valid === 'yes', `${input} ${valid}`);
	});

	t.end();
});
