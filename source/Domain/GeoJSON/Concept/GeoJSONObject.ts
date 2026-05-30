import { all, type Guard, isString, isStructure } from '@konfirm/guard';
import {
	type BoundingBox,
	isBoundingBox,
	isStrictBoundingBox,
} from './BoundingBox';

type GeoJSONBase = {
	type: string;
	bbox?: BoundingBox;
	[key: string]: unknown;
};
export type GeoJSONObject<T extends GeoJSONBase = GeoJSONBase> = GeoJSONBase &
	T;
export function isGeoJSONObject<T extends GeoJSONBase>(type: string): Guard<T> {
	return isStructure<T>(
		{
			type: all(isString, (value: unknown) => value === type),
			bbox: isBoundingBox,
		},
		'bbox',
	);
}
export function isStrictGeoJSONObject<T extends GeoJSONBase>(
	type: string,
): Guard<T> {
	return isStructure<T>(
		{
			type: all(isString, (value: unknown) => value === type),
			bbox: isStrictBoundingBox,
		},
		'bbox',
	);
}
