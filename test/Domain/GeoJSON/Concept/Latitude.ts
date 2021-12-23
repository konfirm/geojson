import test from 'tape';
import each from 'template-literal-each';
import * as Export from '../../../../source/Domain/GeoJSON/Concept/Latitude';
import { exported } from '../../../helper/geometry';

exported(test, 'Domain/GeoJSON/Concept/Latitude', Export, 'isLatitude', 'isStrictLatitude');

const { isLatitude, isStrictLatitude } = Export;

test('Domain/GeoJSON/Concept/Latitude - isLatitude', (t) => {
	each`
		input           | valid
		----------------|-------
		${0}            | yes
		${0.0000000001} | yes
		${51.9851034}   | yes
		${-90}          | yes
		${-90.1}        | yes
		${90}           | yes
		${90.1}         | yes
		${-Infinity}    | no
		${Infinity}     | no
		${NaN}          | no
		${'1234'}       | no
		${false}        | no
		${true}         | no
	`(({ input, valid }) => {
		t.equal(isLatitude(input), valid === 'yes', `${input} ${valid}`);
	});

	t.end();
});

test('Domain/GeoJSON/Concept/Latitude - isStrictLatitude', (t) => {
	each`
		input           | valid
		----------------|-------
		${0}            | yes
		${0.0000000001} | yes
		${51.9851034}   | yes
		${-90}          | yes
		${-90.1}        | no
		${90}           | yes
		${90.1}         | no
		${-Infinity}    | no
		${Infinity}     | no
		${NaN}          | no
		${'1234'}       | no
		${false}        | no
		${true}         | no
	`(({ input, valid }) => {
		t.equal(isStrictLatitude(input), valid === 'yes', `${input} ${valid}`);
	});

	t.end();
});
