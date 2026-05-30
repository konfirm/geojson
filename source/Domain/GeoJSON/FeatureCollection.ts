import { all, isArrayOfType, isKeyOfType } from '@konfirm/guard';
import { type GeoJSONObject, isGeoJSONObject } from './Concept/GeoJSONObject';
import { type Feature, isFeature, isStrictFeature } from './Feature';

export type FeatureCollection = GeoJSONObject<{
	type: 'FeatureCollection';
	features: Array<Feature>;
}>;
export const isFeatureCollection = all<FeatureCollection>(
	isGeoJSONObject('FeatureCollection'),
	isKeyOfType('features', isArrayOfType(isFeature)),
);
export const isStrictFeatureCollection = all<FeatureCollection>(
	isGeoJSONObject('FeatureCollection'),
	isKeyOfType('features', isArrayOfType(isStrictFeature)),
);
