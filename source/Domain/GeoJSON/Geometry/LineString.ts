import { Guard } from "../../Guards/Utility";
import { GeometryObject, isGeometryObject } from "../GeometryObject";
import { isMultiPointCoordinates, isStrictMultiPointCoordinates, MultiPoint } from "./MultiPoint";

export type LineString = GeometryObject<{
	type: 'LineString';
	coordinates: MultiPoint['coordinates'];
}>
export const isLineStringCoordinates = isMultiPointCoordinates;
export const isLineString: Guard<LineString> = isGeometryObject<LineString>('LineString', isLineStringCoordinates);
export const isStrictLineStringCoordinates = isStrictMultiPointCoordinates;
export const isStrictLineString: Guard<LineString> = isGeometryObject<LineString>('LineString', isStrictLineStringCoordinates);
