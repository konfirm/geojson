import { any } from '@konfirm/guard';
import { type Feature, isFeature, isStrictFeature } from './Feature';
import {
	type FeatureCollection,
	isFeatureCollection,
	isStrictFeatureCollection,
} from './FeatureCollection';
import { type Geometry, isGeometry, isStrictGeometry } from './Geometry';
import {
	type GeometryCollection,
	isGeometryCollection,
	isStrictGeometryCollection,
} from './GeometryCollection';

export type GeoJSON =
	| Geometry
	| GeometryCollection
	| Feature
	| FeatureCollection;
export const isGeoJSON = any<GeoJSON>(
	isGeometry,
	isGeometryCollection,
	isFeature,
	isFeatureCollection,
);
export const isStrictGeoJSON = any<GeoJSON>(
	isStrictGeometry,
	isStrictGeometryCollection,
	isStrictFeature,
	isStrictFeatureCollection,
);
