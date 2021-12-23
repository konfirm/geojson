import test from 'tape';
import * as Export from '../../../source/Domain/GeoJSON/GeometryObject';

test('Domain/GeoJSON/GeometryObject - exports', (t) => {
	const expect = [
		'isGeometryObject',
	];

	t.deepEqual(Object.keys(Export), expect, `exports ${expect.join(', ')}`);
	expect.forEach((key) => {
		t.equal(typeof Export[key], 'function', `${key} is a function`);
	});
	t.end();
});

const { isGeometryObject } = Export;

test('Domain/GeoJSON/GeometryObject - isGeometryObject', (t) => {
	t.end();
});
