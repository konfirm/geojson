import test from 'tape';
import each from 'template-literal-each';
import * as Export from '../../../../source/Domain/GeoJSON/Concept/ExteriorRing';
import { exported } from '../../../helper/geometry';
import { coordinates as Italy } from '../../../data/Italy';
import { coordinates as SanMarino, polygon } from '../../../data/SanMarino';
import { coordinates as HolySee } from '../../../data/HolySee';

exported('Domain/GeoJSON/Concept/ExteriorRing', Export, 'isExteriorRing', 'isStrictExteriorRing');

const { isExteriorRing, isStrictExteriorRing } = Export;

test('Domain/GeoJSON/Concept/ExteriorRing - isExteriorRing', (t) => {
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
		t.equal(isExteriorRing(input), valid === 'yes', `[${input}] isExteriorRing ${valid}`);
	});

	t.ok(Italy.every((polygon) => polygon.every(isExteriorRing)), 'coordinates for Italy polygon all match isExteriorRing');
	t.notOk(SanMarino.every(isExteriorRing), 'coordinates for SanMarino does not match isExteriorRing');
	t.notOk(HolySee.every(isExteriorRing), 'coordinates for HolySee does not match isExteriorRing');

	t.end();
});

test('Domain/GeoJSON/Concept/ExteriorRing - isStrictExteriorRing', (t) => {
	each`
		input                                            | valid
		-------------------------------------------------|----
		${undefined}                                     | no
		${null}                                          | no
		${'[[1,0],[1,1],[0,1],[1,0]]'}                   | no
		${[[1, 0], [1, 1], [0, 1], [0, 0.5], [1, 0]]}    | no
		${[[1, 0], [0, 0.5], [0, 1], [1, 1], [1, 0]]}    | yes
		${[[1, 0], [1, 1], [0, 1], [1, 0]]}              | no
		${[[1, 0], [1, 1], [0, 1], [0, 0]]}              | no
		${[[1, 0], [1, 1], [1, 0]]}                      | no
		${[[1, 0], [1, 0]]}                              | no
		${[[1, 0]]}                                      | no
		${[[-181, -91], [0, -91], [0, 91], [-181, -91]]} | no
	`(({ input, valid }) => {
		t.equal(isStrictExteriorRing(input), valid === 'yes', `[${input}] isStrictExteriorRing ${valid}`);
	});

	t.notOk(Italy.every((polygon) => polygon.every(isStrictExteriorRing)), 'coordinates for Italy polygon do not match isStrictExteriorRing');
	t.ok(Italy.every((polygon) => isStrictExteriorRing(polygon[0])), 'first polygon coordinates for Italy all match isStrictExteriorRing');
	t.ok(Italy.filter((polygon) => polygon.length > 1).every((polygon) => !polygon.slice(1).some(isStrictExteriorRing)), 'second+ polygon coordinates for Italy none match isStrictExteriorRing')
	t.notOk(SanMarino.every(isStrictExteriorRing), 'coordinates for SanMarino does not match isStrictExteriorRing');
	t.notOk(HolySee.every(isStrictExteriorRing), 'coordinates for HolySee does not match isStrictExteriorRing');

	t.end();
});
