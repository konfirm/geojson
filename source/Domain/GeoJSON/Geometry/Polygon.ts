import { all, isArrayOfType } from "@konfirm/guard";
import { GeometryObject, isGeometryObject } from "../GeometryObject";
import { ExteriorRing, isExteriorRing } from "../Concept/ExteriorRing";
import { InteriorRing, isInteriorRing } from "../Concept/InteriorRing";
import { isLinearRing, isStrictLinearRing } from "../Concept/LinearRing";

export type Polygon = GeometryObject<{
	type: 'Polygon';
	coordinates: [ExteriorRing, ...Array<InteriorRing>];
}>
export const isPolygonCoordinates = all(
	isArrayOfType(isLinearRing)
);
export const isPolygon = isGeometryObject<Polygon>('Polygon', isPolygonCoordinates);
export const isStrictPolygonCoordinates = all(
	isArrayOfType(isStrictLinearRing),
	(value: any) => isExteriorRing(value[0]),
	(value: any) => value.slice(1).every(isInteriorRing)
);
export const isStrictPolygon = isGeometryObject<Polygon>('Polygon', isStrictPolygonCoordinates);
