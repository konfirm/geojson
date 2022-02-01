import { all, isArrayOfType, isKeyOfType, isStructure } from "@konfirm/guard";
import { Feature, isFeature, isStrictFeature } from "./Feature";
import { GeoJSONObject, isGeoJSONObject } from "./Concept/GeoJSONObject";

export type FeatureCollection = GeoJSONObject<{
	type: 'FeatureCollection';
	features: Array<Feature>;
}>
export const isFeatureCollection = all<FeatureCollection>(
	isGeoJSONObject('FeatureCollection'),
	isKeyOfType('features', isArrayOfType(isFeature))
);
export const isStrictFeatureCollection = all<FeatureCollection>(
	isGeoJSONObject('FeatureCollection'),
	isKeyOfType('features', isArrayOfType(isStrictFeature))
);
