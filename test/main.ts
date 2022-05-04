import test from 'tape';
import * as Export from '../source/main';

test('main - exports', (t) => {
	const functions = [
		'intersect',
		'distance',
		'SimpleGeometryIterator',
		'isGeoJSON',
		'isStrictGeoJSON',
		'isPoint',
		'isStrictPoint',
		'isMultiPoint',
		'isStrictMultiPoint',
		'isLineString',
		'isStrictLineString',
		'isMultiLineString',
		'isStrictMultiLineString',
		'isPolygon',
		'isStrictPolygon',
		'isMultiPolygon',
		'isStrictMultiPolygon',
		'isGeometryCollection',
		'isStrictGeometryCollection',
		'isFeature',
		'isStrictFeature',
		'isFeatureCollection',
		'isStrictFeatureCollection',
	];

	t.deepEqual(Object.keys(Export), functions, `exports ${functions.join(', ')}`);

	functions.forEach((key) => {
		t.equal(typeof Export[key], 'function', `${key} is a function`);
	});

	t.end();
});
