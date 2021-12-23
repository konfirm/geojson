import test from 'tape';
import each from 'template-literal-each';
import * as Export from '../../../../source/Domain/GeoJSON/Concept/BoundingBox';
import { exported } from '../../../helper/geometry';

exported(test, 'Domain/GeoJSON/Concept/BoundingBox', Export, 'isBoundingBox', 'isStrictBoundingBox');

const { isBoundingBox, isStrictBoundingBox } = Export;

test('Domain/GeoJSON/Concept/BoundingBox - isBoundingBox', (t) => {
	each`
		input                                    | valid
		-----------------------------------------|-------
		${[-10.0, -10.0, 10.0, 10.0]}            | yes
		${[100.0, 0.0, 105.0, 1.0]}              | yes
		${[100.0, 0.0, -100.0, 105.0, 1.0, 0.0]} | yes
		${[177.0, -20.0, -178.0, -16.0]}         | yes
		${[-178.0, -20.0, 177.0, -16.0]}         | yes
		${[-370.0, -190.0, 190.0, 370.0]}        | yes
		${[]}                                    | no
		${[0]}                                   | no
		${[-180]}                                | no
		${[0, 0]}                                | no
		${[-180, -90]}                           | no
		${[0, 0, 0]}                             | no
		${[-180, -90, 180]}                      | no
		${[0, 0, 0, 0]}                          | yes
		${[-180, -90, 180, 90]}                  | yes
		${[0, 0, 0, 0, 0]}                       | no
		${[-180, -90, 0, 180, 90]}               | no
		${[0, 0, 0, 0, 0, 0]}                    | yes
		${[-180, -90, 0, 180, 90, 0]}            | yes
		${[180, 90, 0, -180, -90, 0]}            | no
		${[-180, 90, 0, 180, -90, 0]}            | no
		${[180, -90, 0, -180, 90, 0]}            | yes
		${[-181, -91, 0, 181, 91, 0]}            | yes
	`(({ input, valid }) => {
		t.equal(isBoundingBox(input), valid === 'yes', `[${input}] isBoudingBox ${valid}`)
	});

	t.end();
});

test('Domain/GeoJSON/Concept/BoundingBox - isStrictBoundingBox', (t) => {
	each`
		input                                    | valid
		-----------------------------------------|-------
		${[-10.0, -10.0, 10.0, 10.0]}            | yes
		${[100.0, 0.0, 105.0, 1.0]}              | yes
		${[100.0, 0.0, -100.0, 105.0, 1.0, 0.0]} | yes
		${[177.0, -20.0, -178.0, -16.0]}         | yes
		${[-178.0, -20.0, 177.0, -16.0]}         | yes
		${[-370.0, -190.0, 190.0, 370.0]}        | no
		${[]}                                    | no
		${[0]}                                   | no
		${[-180]}                                | no
		${[0, 0]}                                | no
		${[-180, -90]}                           | no
		${[0, 0, 0]}                             | no
		${[-180, -90, 180]}                      | no
		${[0, 0, 0, 0]}                          | yes
		${[-180, -90, 180, 90]}                  | yes
		${[0, 0, 0, 0, 0]}                       | no
		${[-180, -90, 0, 180, 90]}               | no
		${[0, 0, 0, 0, 0, 0]}                    | yes
		${[-180, -90, 0, 180, 90, 0]}            | yes
		${[180, 90, 0, -180, -90, 0]}            | no
		${[180, 90, 0, -180, -90, 0]}            | no
		${[-180, 90, 0, 180, -90, 0]}            | no
		${[180, -90, 0, -180, 90, 0]}            | yes
		${[-181, -91, 0, 181, 91, 0]}            | no
	`(({ input, valid }) => {
		t.equal(isStrictBoundingBox(input), valid === 'yes', `[${input}] isStrictBoudingBox ${valid}`)
	});

	t.end();
});
