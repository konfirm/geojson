import { isArrayOfType } from "@konfirm/guard";
import { isGeometryObject, MultiGeometryObject } from "../GeometryObject";
import { isPolygonCoordinates, isStrictPolygonCoordinates, Polygon } from "./Polygon";

export type MultiPolygon = MultiGeometryObject<Polygon>
export const isMultiPolygonCoordinates = isArrayOfType(isPolygonCoordinates);
export const isMultiPolygon = isGeometryObject<MultiPolygon>('MultiPolygon', isMultiPolygonCoordinates);
export const isStrictMultiPolygonCoordinates = isArrayOfType(isStrictPolygonCoordinates);
export const isStrictMultiPolygon = isGeometryObject<MultiPolygon>('MultiPolygon', isStrictMultiPolygonCoordinates);
