import {
	all,
	any,
	type Guard,
	isNULL,
	isObject,
	isStructure,
} from '@konfirm/guard';
import { type GeoJSONObject, isGeoJSONObject } from './Concept/GeoJSONObject';
import { type Geometry, isGeometry, isStrictGeometry } from './Geometry';

export type Feature<G extends Geometry | null = Geometry | null> =
	GeoJSONObject<{
		type: 'Feature';
		geometry: G;
		properties: { [key: string]: unknown } | null;
	}>;

const isFeatureObject = all<Feature<Geometry | null>>(
	isGeoJSONObject('Feature'),
	isStructure({
		geometry: any(isNULL, isGeometry),
		properties: any(isNULL, isObject),
	}),
);
const isStrictFeatureObject = all<Feature<Geometry | null>>(
	isGeoJSONObject('Feature'),
	isStructure({
		geometry: any(isNULL, isStrictGeometry),
		properties: any(isNULL, isObject),
	}),
);

export function isFeature<G extends Geometry | null>(
	input: unknown,
	isG: Guard<G> = any(isNULL, isGeometry),
): input is Feature<G> {
	return isFeatureObject(input) && isG(input.geometry);
}

export function isStrictFeature<G extends Geometry | null>(
	input: unknown,
	isG: Guard<G> = any(isNULL, isStrictGeometry),
): input is Feature<G> {
	return isStrictFeatureObject(input) && isG(input.geometry);
}
