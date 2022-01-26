import { all, Guard, isKeyOfType, Validator } from "@konfirm/guard";
import { GeoJSONObject, isGeoJSONObject } from "./Concept/GeoJSONObject";

type GeometryBase = GeoJSONObject & {
	coordinates: Array<unknown>;
}

export type GeometryObject<T extends GeometryBase>
	= Omit<GeometryBase, 'coordinates'>
	& T;
export type MultiGeometryObject<T extends GeometryBase> = GeometryObject<{
	type: `Multi${T['type']}`;
	coordinates: Array<T['coordinates']>;
}>;
export function isGeometryObject<T extends GeometryBase>(type: string, isCoordinates: Validator): Guard<T> {
	return all<T>(
		isGeoJSONObject(type),
		isKeyOfType('coordinates', isCoordinates)
	);
}
