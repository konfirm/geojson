import { all, any, isArrayOfType, isKeyOfType } from '@konfirm/guard';
import { type GeoJSONObject, isGeoJSONObject } from './Concept/GeoJSONObject';
import { type Geometry, isGeometry, isStrictGeometry } from './Geometry';

export type GeometryCollection = GeoJSONObject<{
	type: 'GeometryCollection';
	geometries: Array<Geometry | GeometryCollection>;
}>;

const isGeometryCollectionObject = all<GeometryCollection>(
	isGeoJSONObject('GeometryCollection'),
	isKeyOfType(
		'geometries',
		isArrayOfType(any(isGeometry, isGeometryCollection)),
	),
);
const isStrictGeometryCollectionObject = all<GeometryCollection>(
	isGeoJSONObject('GeometryCollection'),
	isKeyOfType(
		'geometries',
		isArrayOfType(any(isStrictGeometry, isStrictGeometryCollection)),
	),
);
export function isGeometryCollection(
	value: unknown,
): value is GeometryCollection {
	return isGeometryCollectionObject(value);
}
export function isStrictGeometryCollection(
	value: unknown,
): value is GeometryCollection {
	return isStrictGeometryCollectionObject(value);
}
