import { any } from "@konfirm/guard";
import { isLineString, isStrictLineString, LineString } from "./Geometry/LineString";
import { isMultiLineString, isStrictMultiLineString, MultiLineString } from "./Geometry/MultiLineString";
import { isMultiPoint, isStrictMultiPoint, MultiPoint } from "./Geometry/MultiPoint";
import { isMultiPolygon, isStrictMultiPolygon, MultiPolygon } from "./Geometry/MultiPolygon";
import { isPoint, isStrictPoint, Point } from "./Geometry/Point";
import { isPolygon, isStrictPolygon, Polygon } from "./Geometry/Polygon";

export type Geometries = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;
export const isGeometries = any(isPoint, isMultiPoint, isLineString, isMultiLineString, isPolygon, isMultiPolygon);
export const isStrictGeometries = any(isStrictPoint, isStrictMultiPoint, isStrictLineString, isStrictMultiLineString, isStrictPolygon, isStrictMultiPolygon);
