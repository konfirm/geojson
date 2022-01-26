import { all, any, isNULL, isObject, isStructure } from "@konfirm/guard";
import { GeoJSONObject, isGeoJSONObject } from "./Concept/GeoJSONObject";
import { Geometries, isGeometries, isStrictGeometries } from "./Geometries";
import { GeometryCollection, isGeometryCollection, isStrictGeometryCollection } from "./GeometryCollection";

export type Feature = GeoJSONObject<{
	type: 'Feature';
	geometry: Geometries | GeometryCollection;
	properties: { [key: string]: unknown } | null;
}>
export const isFeature = all(
	isGeoJSONObject('Feature'),
	isStructure({
		geometry: any(isGeometries, isGeometryCollection),
		properties: any(isNULL, isObject)
	})
);
export const isStrictFeature = all(
	isGeoJSONObject('Feature'),
	isStructure({
		geometry: any(isStrictGeometries, isStrictGeometryCollection),
		properties: any(isNULL, isObject)
	})
);
