import test from 'tape';
import each from 'template-literal-each';
import * as Export from '../../../../source/Domain/GeoJSON/Concept/GeoJSONObject';
import { exported } from '../../../helper/geometry';

exported('Domain/GeoJSON/Concept/GeoJSONObject', Export, 'isGeoJSONObject', 'isStrictGeoJSONObject');

const { isGeoJSONObject, isStrictGeoJSONObject } = Export;

test('Domain/GeoJSON/Concept/GeoJSONObject - isGeoJSONObject', (t) => {
	each`
		type         | bbox                          | valid
		-------------|-------------------------------|-------
		Type         |                               | yes
		Type         | ${[0, 0, 0, 0]}               | yes
		Type         | ${[0, 0, 0, 0, 0, 0]}         | yes
		Type         | ${[-181, -91, 0, 181, 91, 0]} | yes
		${undefined} |                               | no
		${null}      |                               | no
		${true}      |                               | no
		${false}     |                               | no
		${12345}     |                               | no
	`(({ type, bbox, valid }: any) => {
		const validate = isGeoJSONObject(type);
		const input = Object.assign({ type }, bbox ? { bbox } : {});

		t.equal(typeof validate, 'function', `creates isGeoJSONObject validator for type ${JSON.stringify(type)}`);
		t.equal(validate(input), valid === 'yes', `type ${JSON.stringify(type)} validates ${JSON.stringify(input)} ${valid}`);
	});

	t.end();
});

test('Domain/GeoJSON/Concept/GeoJSONObject - isStrictGeoJSONObject', (t) => {
	each`
		type         | bbox                          | valid
		-------------|-------------------------------|-------
		Type         |                               | yes
		Type         | ${[0, 0, 0, 0]}               | yes
		Type         | ${[0, 0, 0, 0, 0, 0]}         | yes
		Type         | ${[-181, -91, 0, 181, 91, 0]} | no
		${undefined} |                               | no
		${null}      |                               | no
		${true}      |                               | no
		${false}     |                               | no
		${12345}     |                               | no
	`(({ type, bbox, valid }: any) => {
		const validate = isStrictGeoJSONObject(type);
		const input = Object.assign({ type }, bbox ? { bbox } : {});

		t.equal(typeof validate, 'function', `creates isStrictGeoJSONObject validator for type ${JSON.stringify(type)}`);
		t.equal(validate(input), valid === 'yes', `type ${JSON.stringify(type)} validates ${JSON.stringify(input)} ${valid}`);
	});

	t.end();
});
