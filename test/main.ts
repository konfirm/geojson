import test from 'tape';
import * as Export from '../source/main';

test('main - exports', (t) => {
	const functions = [
		'intersect',
		'distance',
		'SimpleGeometryIterator',
		'isGeoJSON',
		'isStrictGeoJSON',
		'isPointCoordinates',
		'isPoint',
		'isStrictPointCoordinates',
		'isStrictPoint',
		'isMultiPointCoordinates',
		'isMultiPoint',
		'isStrictMultiPointCoordinates',
		'isStrictMultiPoint',
		'isLineStringCoordinates',
		'isLineString',
		'isStrictLineStringCoordinates',
		'isStrictLineString',
		'isMultiLineStringCoordinates',
		'isMultiLineString',
		'isStrictMultiLineStringCoordinates',
		'isStrictMultiLineString',
		'isPolygonCoordinates',
		'isPolygon',
		'isStrictPolygonCoordinates',
		'isStrictPolygon',
		'isMultiPolygonCoordinates',
		'isMultiPolygon',
		'isStrictMultiPolygonCoordinates',
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
