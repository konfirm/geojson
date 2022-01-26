import { isArrayOfType } from "@konfirm/guard";
import { isGeometryObject, MultiGeometryObject } from "../GeometryObject";
import { isLineStringCoordinates, isStrictLineStringCoordinates, LineString } from "./LineString";

export type MultiLineString = MultiGeometryObject<LineString>;
export const isMultiLineStringCoordinates = isArrayOfType(isLineStringCoordinates);
export const isMultiLineString = isGeometryObject<MultiLineString>('MultiLineString', isMultiLineStringCoordinates);
export const isStrictMultiLineStringCoordinates = isArrayOfType(isStrictLineStringCoordinates);
export const isStrictMultiLineString = isGeometryObject<MultiLineString>('MultiLineString', isStrictMultiLineStringCoordinates);
