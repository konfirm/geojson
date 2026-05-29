import { any } from '@konfirm/guard';
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

export type Geometry =
	| Point
	| MultiPoint
	| LineString
	| MultiLineString
	| Polygon
	| MultiPolygon;
export const isGeometry = any<Geometry>(
	isPoint,
	isMultiPoint,
	isLineString,
	isMultiLineString,
	isPolygon,
	isMultiPolygon,
);
export const isStrictGeometry = any<Geometry>(
	isStrictPoint,
	isStrictMultiPoint,
	isStrictLineString,
	isStrictMultiLineString,
	isStrictPolygon,
	isStrictMultiPolygon,
);
