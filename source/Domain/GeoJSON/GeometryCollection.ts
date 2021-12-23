import { all, any, isArrayOfType, isKeyOfType } from "@konfirm/guard";
import { GeoJSONObject, isGeoJSONObject } from "./Concept/GeoJSONObject";
import { Geometries, isGeometries, isStrictGeometries } from "./Geometries";

export type GeometryCollection = GeoJSONObject<{
	type: 'GeometryCollection';
	geometries: Array<Geometries | GeometryCollection>;
}>;

const isGeometryCollectionObject = all(
	isGeoJSONObject('GeometryCollection'),
	isKeyOfType('geometries', isArrayOfType(any(isGeometries, isGeometryCollection)))
);
const isStrictGeometryCollectionObject = all(
	isGeoJSONObject('GeometryCollection'),
	isKeyOfType('geometries', isArrayOfType(any(isStrictGeometries, isStrictGeometryCollection)))
);
export function isGeometryCollection(value: any): value is GeometryCollection {
	return isGeometryCollectionObject(value)
}
export function isStrictGeometryCollection(value: any): value is GeometryCollection {
	return isStrictGeometryCollectionObject(value)
}
