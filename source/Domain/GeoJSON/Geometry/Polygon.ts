import { all, isArrayOfType } from '@konfirm/guard';
import { type ExteriorRing, isExteriorRing } from '../Concept/ExteriorRing';
import { type InteriorRing, isInteriorRing } from '../Concept/InteriorRing';
import { isLinearRing, isStrictLinearRing } from '../Concept/LinearRing';
import { type GeometryObject, isGeometryObject } from '../GeometryObject';

export type Polygon = GeometryObject<{
	type: 'Polygon';
	coordinates: [ExteriorRing, ...Array<InteriorRing>];
}>;
export const isPolygonCoordinates = all(isArrayOfType(isLinearRing));
export const isPolygon = isGeometryObject<Polygon>(
	'Polygon',
	isPolygonCoordinates,
);
export const isStrictPolygonCoordinates = all(
	isArrayOfType(isStrictLinearRing),
	(value: unknown) => isExteriorRing((<Array<unknown>>value)[0]),
	(value: unknown) => (<Array<unknown>>value).slice(1).every(isInteriorRing),
);
export const isStrictPolygon = isGeometryObject<Polygon>(
	'Polygon',
	isStrictPolygonCoordinates,
);
