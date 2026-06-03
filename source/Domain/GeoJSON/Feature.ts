import { all, any, isNULL, isObject, isStructure } from '@konfirm/guard';
import { type GeoJSONObject, isGeoJSONObject } from './Concept/GeoJSONObject';
import { type Geometry, isGeometry, isStrictGeometry } from './Geometry';

export type Feature = GeoJSONObject<{
	type: 'Feature';
	geometry: Geometry;
	properties: { [key: string]: unknown } | null;
}>;
export const isFeature = all<Feature>(
	isGeoJSONObject('Feature'),
	isStructure({
		geometry: isGeometry,
		properties: any(isNULL, isObject),
	}),
);
export const isStrictFeature = all<Feature>(
	isGeoJSONObject('Feature'),
	isStructure({
		geometry: isStrictGeometry,
		properties: any(isNULL, isObject),
	}),
);
