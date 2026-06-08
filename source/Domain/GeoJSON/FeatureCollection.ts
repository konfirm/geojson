import {
	all,
	any,
	type Guard,
	isArrayOfType,
	isKeyOfType,
	isNULL,
} from '@konfirm/guard';
import { type GeoJSONObject, isGeoJSONObject } from './Concept/GeoJSONObject';
import { type Feature, isFeature, isStrictFeature } from './Feature';
import { type Geometry, isGeometry } from './Geometry';

export type FeatureCollection<G extends Geometry | null = Geometry | null> =
	GeoJSONObject<{
		type: 'FeatureCollection';
		features: Array<Feature<G>>;
	}>;

const isFeatureCollectionObject = all<FeatureCollection>(
	isGeoJSONObject('FeatureCollection'),
	isKeyOfType('features', isArrayOfType(isFeature)),
);
const isStrictFeatureCollectionObject = all<FeatureCollection>(
	isGeoJSONObject('FeatureCollection'),
	isKeyOfType('features', isArrayOfType(isStrictFeature)),
);

export function isFeatureCollection<G extends Geometry | null>(
	value: unknown,
	isG: Guard<G> = any(isNULL, isGeometry),
): value is FeatureCollection<G> {
	return (
		isFeatureCollectionObject(value) &&
		value.features.every((feature) => isFeature(feature, isG))
	);
}

export function isStrictFeatureCollection<G extends Geometry | null>(
	value: unknown,
	isG: Guard<G> = any(isNULL, isGeometry),
): value is FeatureCollection<G> {
	return (
		isStrictFeatureCollectionObject(value) &&
		value.features.every((feature) => isStrictFeature(feature, isG))
	);
}
