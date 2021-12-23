import { GeometryObject, isGeometryObject } from "../GeometryObject";
import { isPosition, isStrictPosition, Position } from "../Concept/Position";

export type Point = GeometryObject<{
	type: 'Point';
	coordinates: Position;
}>
export const isPointCoordinates = isPosition;
export const isPoint = isGeometryObject<Point>('Point', isPointCoordinates);
export const isStrictPointCoordinates = isStrictPosition;
export const isStrictPoint = isGeometryObject<Point>('Point', isStrictPointCoordinates);
