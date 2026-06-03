import { all, any, isArrayOfType, isKeyOfType } from '@konfirm/guard';
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

export type GeometryCollection = GeoJSONObject<{
	type: 'GeometryCollection';
	geometries: Array<Geometry>;
}>;

export type Geometry =
	| Point
	| MultiPoint
	| LineString
	| MultiLineString
	| Polygon
	| MultiPolygon
	| GeometryCollection;

export const isGeometry = any<Geometry>(
	isPoint,
	isMultiPoint,
	isLineString,
	isMultiLineString,
	isPolygon,
	isMultiPolygon,
	isGeometryCollection,
);

export const isStrictGeometry = any<Geometry>(
	isStrictPoint,
	isStrictMultiPoint,
	isStrictLineString,
	isStrictMultiLineString,
	isStrictPolygon,
	isStrictMultiPolygon,
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

export function isGeometryCollection(
	value: unknown,
): value is GeometryCollection {
	return isGeometryCollectionObject(value);
}

export function isStrictGeometryCollection(
	value: unknown,
): value is GeometryCollection {
	return isStrictGeometryCollectionObject(value);
}
