import {
	all,
	any,
	type Guard,
	isArrayOfType,
	isKeyOfType,
} from '@konfirm/guard';
import { type GeoJSONObject, isGeoJSONObject } from './Concept/GeoJSONObject';

import {
	isLineString,
	isStrictLineString,
	type LineString,
} from './Geometry/LineString';
import {
	isMultiLineString,
	isStrictMultiLineString,
	type MultiLineString,
} from './Geometry/MultiLineString';
import {
	isMultiPoint,
	isStrictMultiPoint,
	type MultiPoint,
} from './Geometry/MultiPoint';
import {
	isMultiPolygon,
	isStrictMultiPolygon,
	type MultiPolygon,
} from './Geometry/MultiPolygon';
import { isPoint, isStrictPoint, type Point } from './Geometry/Point';
import { isPolygon, isStrictPolygon, type Polygon } from './Geometry/Polygon';

export type GeometryPrimitive =
	| Point
	| MultiPoint
	| LineString
	| MultiLineString
	| Polygon
	| MultiPolygon;

export const isGeometryPrimitive = any<GeometryPrimitive>(
	isPoint,
	isMultiPoint,
	isLineString,
	isMultiLineString,
	isPolygon,
	isMultiPolygon,
);

export const isStrictGeometryPrimitive = any<GeometryPrimitive>(
	isStrictPoint,
	isStrictMultiPoint,
	isStrictLineString,
	isStrictMultiLineString,
	isStrictPolygon,
	isStrictMultiPolygon,
);

export type GeometryCollection<
	G extends GeometryPrimitive = GeometryPrimitive,
> = GeoJSONObject<{
	type: 'GeometryCollection';
	geometries: Array<G | GeometryCollection<G>>;
}>;

export type Geometry = GeometryPrimitive | GeometryCollection;

export const isGeometry = any<Geometry>(
	isGeometryPrimitive,
	isGeometryCollection,
);

export const isStrictGeometry = any<Geometry>(
	isStrictGeometryPrimitive,
	isStrictGeometryCollection,
);

const isGeometryCollectionObject = all<GeometryCollection>(
	isGeoJSONObject('GeometryCollection'),
	isKeyOfType('geometries', isArrayOfType(isGeometry)),
);

const isStrictGeometryCollectionObject = all<GeometryCollection>(
	isGeoJSONObject('GeometryCollection'),
	isKeyOfType('geometries', isArrayOfType(isStrictGeometry)),
);

export function isGeometryCollection<
	G extends GeometryPrimitive = GeometryPrimitive,
>(
	value: unknown,
	isG: Guard<G> = isGeometryPrimitive as Guard<G>,
): value is GeometryCollection<G> {
	return (
		isGeometryCollectionObject(value) &&
		value.geometries.every((g) => isG(g) || isGeometryCollection(g, isG))
	);
}

export function isStrictGeometryCollection<
	G extends GeometryPrimitive = GeometryPrimitive,
>(
	value: unknown,
	isG: Guard<G> = isStrictGeometryPrimitive as Guard<G>,
): value is GeometryCollection<G> {
	return (
		isStrictGeometryCollectionObject(value) &&
		value.geometries.every(
			(g) => isG(g) || isStrictGeometryCollection(g, isG),
		)
	);
}
