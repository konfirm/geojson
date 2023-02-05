import test from 'tape';
import { each } from 'template-literal-each';
import * as Export from '../../../../source/Domain/GeoJSON/Concept/InteriorRing';
import { exported } from '../../../helper/geometry';
import { coordinates as Italy } from '../../../data/Italy';
import { coordinates as SanMarino, polygon } from '../../../data/SanMarino';
import { coordinates as HolySee } from '../../../data/HolySee';

exported('Domain/GeoJSON/Concept/InteriorRing', Export, 'isInteriorRing', 'isStrictInteriorRing');

const { isInteriorRing, isStrictInteriorRing } = Export;

test('Domain/GeoJSON/Concept/InteriorRing - isInteriorRing', (t) => {
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
		t.equal(isInteriorRing(input), valid === 'yes', `[${input}] isInteriorRing ${valid}`);
	});

	t.ok(Italy.every((polygon) => polygon.every(isInteriorRing)), 'coordinates for Italy polygon all match isInteriorRing');
	t.notOk(SanMarino.every(isInteriorRing), 'coordinates for SanMarino does not match isInteriorRing');
	t.notOk(HolySee.every(isInteriorRing), 'coordinates for HolySee does not match isInteriorRing');

	t.end();
});

test('Domain/GeoJSON/Concept/InteriorRing - isStrictInteriorRing', (t) => {
	each`
		input                                            | valid
		-------------------------------------------------|----
		${undefined}                                     | no
		${null}                                          | no
		${'[[1,0],[1,1],[0,1],[1,0]]'}                   | no
		${[[1, 0], [1, 1], [0, 1], [0, 0.5], [1, 0]]}    | yes
		${[[1, 0], [0, 0.5], [0, 1], [1, 1], [1, 0]]}    | no
		${[[1, 0], [1, 1], [0, 1], [1, 0]]}              | yes
		${[[1, 0], [1, 1], [0, 1], [0, 0]]}              | no
		${[[1, 0], [1, 1], [1, 0]]}                      | no
		${[[1, 0], [1, 0]]}                              | no
		${[[1, 0]]}                                      | no
		${[[-181, -91], [0, -91], [0, 91], [-181, -91]]} | no
	`(({ input, valid }) => {
		t.equal(isStrictInteriorRing(input), valid === 'yes', `[${input}] isStrictInteriorRing ${valid}`);
	});

	t.notOk(Italy.every((polygon) => polygon.every(isStrictInteriorRing)), 'coordinates for Italy polygon do not match isStrictInteriorRing');
	t.ok(Italy.every((polygon) => !isStrictInteriorRing(polygon[0])), 'first polygon coordinates for Italy none match isStrictInteriorRing');
	t.ok(Italy.filter((polygon) => polygon.length > 1).every((polygon) => polygon.slice(1).every(isStrictInteriorRing)), 'second+ polygon coordinates for Italy none match isStrictInteriorRing')
	t.notOk(SanMarino.every(isStrictInteriorRing), 'coordinates for SanMarino does not match isStrictInteriorRing');
	t.notOk(HolySee.every(isStrictInteriorRing), 'coordinates for HolySee does not match isStrictInteriorRing');

	t.end();
});
