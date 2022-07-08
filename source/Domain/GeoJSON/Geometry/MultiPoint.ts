import { isArrayOfType } from "@konfirm/guard";
import { Guard } from "../../Guards/Utility";
import { isGeometryObject, MultiGeometryObject } from "../GeometryObject";
import { isPointCoordinates, isStrictPointCoordinates, Point } from "./Point";

export type MultiPoint = MultiGeometryObject<Point>
export const isMultiPointCoordinates: Guard<MultiPoint['coordinates']> = isArrayOfType(isPointCoordinates)
export const isMultiPoint = isGeometryObject<MultiPoint>('MultiPoint', isMultiPointCoordinates);
export const isStrictMultiPointCoordinates: Guard<MultiPoint['coordinates']> = isArrayOfType(isStrictPointCoordinates)
export const isStrictMultiPoint = isGeometryObject<MultiPoint>('MultiPoint', isStrictMultiPointCoordinates);
