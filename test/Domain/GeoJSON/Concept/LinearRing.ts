import test from 'tape';
import { each } from 'template-literal-each';
import * as Export from '../../../../source/Domain/GeoJSON/Concept/LinearRing';
import { exported } from '../../../helper/geometry';
import { coordinates as Italy } from '../../../data/Italy';
import { coordinates as SanMarino } from '../../../data/SanMarino';
import { coordinates as HolySee } from '../../../data/HolySee';

exported('Domain/GeoJSON/Concept/LinearRing', Export, 'isLinearRing', 'isStrictLinearRing');

const { isLinearRing, isStrictLinearRing } = Export;

test('Domain/GeoJSON/Concept/LinearRing - isLinearRing', (t) => {
	each`
		input                                            | valid
		-------------------------------------------------|----
		${undefined}                                     | no
		${null}                                          | no
		${'[[1,0],[1,1],[0,1],[1,0]]'}                   | no
		${[[1, 0], [1, 1], [0, 1], [0, 0.5], [1, 0]]}    | yes
		${[[1, 0], [0, 0.5], [0, 1], [1, 1], [1, 0]]}    | yes
		${[[1, 0], [1, 1], [0, 1], [1, 0]]}              | yes
		${[[1, 0], [1, 1], [0, 1], [0, 0]]}              | no
		${[[1, 0], [1, 1], [1, 0]]}                      | no
		${[[1, 0], [1, 0]]}                              | no
		${[[1, 0]]}                                      | no
		${[[-181, -91], [0, -91], [0, 91], [-181, -91]]} | yes
	`(({ input, valid }) => {
		t.equal(isLinearRing(input), valid === 'yes', `[${input}] isLinearRing ${valid}`);
	});

	t.ok(Italy.every((polygon) => polygon.every(isLinearRing)), 'coordinates for Italy polygon all match isLinearRing');
	t.notOk(SanMarino.every(isLinearRing), 'coordinates for SanMarino does not match isLinearRing');
	t.notOk(HolySee.every(isLinearRing), 'coordinates for HolySee does not match isLinearRing');

	t.end();
});

test('Domain/GeoJSON/Concept/LinearRing - isStrictLinearRing', (t) => {
	each`
		input                                            | valid
		-------------------------------------------------|----
		${undefined}                                     | no
		${null}                                          | no
		${'[[1,0],[1,1],[0,1],[1,0]]'}                   | no
		${[[1, 0], [1, 1], [0, 1], [0, 0.5], [1, 0]]}    | yes
		${[[1, 0], [0, 0.5], [0, 1], [1, 1], [1, 0]]}    | yes
		${[[1, 0], [1, 1], [0, 1], [1, 0]]}              | yes
		${[[1, 0], [1, 1], [0, 1], [0, 0]]}              | no
		${[[1, 0], [1, 1], [1, 0]]}                      | no
		${[[1, 0], [1, 0]]}                              | no
		${[[1, 0]]}                                      | no
		${[[-181, -91], [0, -91], [0, 91], [-181, -91]]} | no
	`(({ input, valid }) => {
		t.equal(isStrictLinearRing(input), valid === 'yes', `[${input}] isStrictLinearRing ${valid}`);
	});

	t.ok(Italy.every((polygon) => polygon.every(isStrictLinearRing)), 'coordinates for Italy polygon all match isStrictLinearRing');
	t.notOk(SanMarino.every(isStrictLinearRing), 'coordinates for SanMarino does not match isStrictLinearRing');
	t.notOk(HolySee.every(isStrictLinearRing), 'coordinates for HolySee does not match isStrictLinearRing');

	t.end();
});
