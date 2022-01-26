import test from 'tape';
import each from 'template-literal-each';
import * as Export from '../../../../source/Domain/GeoJSON/Concept/Altitude';
import { exported } from '../../../helper/geometry';

exported('Domain/GeoJSON/Concept/Altitude', Export, 'isAltitude', 'isStrictAltitude');

const { isAltitude, isStrictAltitude } = Export;

test('Domain/GeoJSON/Concept/Altitude - isAltitude', (t) => {
	each`
		input           | valid
		----------------|-------
		${0}            | yes
		${0.0000000001} | yes
		${1_234_567}    | yes
		${-6_378_137}   | yes
		${-6_378_137.1} | yes
		${20_180_000}   | yes
		${20_180_000.1} | yes
		${-Infinity}    | no
		${Infinity}     | no
		${NaN}          | no
		${'1234'}       | no
		${false}        | no
		${true}         | no
	`(({ input, valid }) => {
		t.equal(isAltitude(input), valid === 'yes', `${input} ${valid}`);
	});

	t.end();
});

test('Domain/GeoJSON/Concept/Altitude - isStrictAltitude', (t) => {
	each`
		input           | valid
		----------------|-------
		${0}            | yes
		${0.0000000001} | yes
		${1_234_567}    | yes
		${-6_378_137}   | yes
		${-6_378_137.1} | no
		${20_180_000}   | yes
		${20_180_000.1} | no
		${-Infinity}    | no
		${Infinity}     | no
		${NaN}          | no
		${'1234'}       | no
		${false}        | no
		${true}         | no
	`(({ input, valid }) => {
		t.equal(isStrictAltitude(input), valid === 'yes', `${input} ${valid}`);
	});

	t.end();
});
