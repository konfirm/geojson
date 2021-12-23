import { isArrayOfType } from "@konfirm/guard";
import { isGeometryObject, MultiGeometryObject } from "../GeometryObject";
import { isPointCoordinates, isStrictPointCoordinates, Point } from "./Point";

export type MultiPoint = MultiGeometryObject<Point>
export const isMultiPointCoordinates = isArrayOfType(isPointCoordinates)
export const isMultiPoint = isGeometryObject<MultiPoint>('MultiPoint', isMultiPointCoordinates);
export const isStrictMultiPointCoordinates = isArrayOfType(isStrictPointCoordinates)
export const isStrictMultiPoint = isGeometryObject<MultiPoint>('MultiPoint', isStrictMultiPointCoordinates);
