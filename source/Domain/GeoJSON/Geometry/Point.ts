import { GeometryObject, isGeometryObject } from "../GeometryObject";
import { isPosition, isStrictPosition, Position } from "../Concept/Position";
import { Guard } from "../../Guards/Utility";

export type Point = GeometryObject<{
	type: 'Point';
	coordinates: Position;
}>
export const isPointCoordinates: Guard<Point['coordinates']> = isPosition;
export const isPoint: Guard<Point> = isGeometryObject<Point>('Point', isPointCoordinates);
export const isStrictPointCoordinates: Guard<Point['coordinates']> = isStrictPosition;
export const isStrictPoint: Guard<Point> = isGeometryObject<Point>('Point', isStrictPointCoordinates);
