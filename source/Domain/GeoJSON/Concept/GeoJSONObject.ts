import { all, Guard, isString, isStructure } from "@konfirm/guard";
import { BoundingBox, isBoundingBox, isStrictBoundingBox } from "./BoundingBox";

type GeoJSONBase = {
	type: string;
	bbox?: BoundingBox;
	[key: string]: unknown;
}
export type GeoJSONObject<T extends GeoJSONBase = GeoJSONBase>
	= GeoJSONBase
	& T;
export function isGeoJSONObject<T extends GeoJSONBase>(type: string): Guard<T> {
	return isStructure<T>({
		type: all(isString, (value: any) => value === type),
		bbox: isBoundingBox,
	}, 'bbox');
}
export function isStrictGeoJSONObject<T extends GeoJSONBase>(type: string): Guard<T> {
	return isStructure<T>({
		type: all(isString, (value: any) => value === type),
		bbox: isStrictBoundingBox,
	}, 'bbox');
}
