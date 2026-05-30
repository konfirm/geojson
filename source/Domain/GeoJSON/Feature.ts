import { all, any, isNULL, isObject, isStructure } from '@konfirm/guard';
import { type GeoJSONObject, isGeoJSONObject } from './Concept/GeoJSONObject';
import { type Geometry, isGeometry, isStrictGeometry } from './Geometry';
import {
	type GeometryCollection,
	isGeometryCollection,
	isStrictGeometryCollection,
} from './GeometryCollection';

export type Feature = GeoJSONObject<{
	type: 'Feature';
	geometry: Geometry | GeometryCollection;
	properties: { [key: string]: unknown } | null;
}>;
export const isFeature = all<Feature>(
	isGeoJSONObject('Feature'),
	isStructure({
		geometry: any(isGeometry, isGeometryCollection),
		properties: any(isNULL, isObject),
	}),
);
export const isStrictFeature = all<Feature>(
	isGeoJSONObject('Feature'),
	isStructure({
		geometry: any(isStrictGeometry, isStrictGeometryCollection),
		properties: any(isNULL, isObject),
	}),
);
