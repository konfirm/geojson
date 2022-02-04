import { all, any } from "@konfirm/guard";
import { isTuple } from "../../Guards/Tuple";
import { isLongitude, Longitude, isStrictLongitude } from "./Longitude";
import { isLatitude, Latitude, isStrictLatitude } from "./Latitude";
import { Altitude, isAltitude, isStrictAltitude } from "./Altitude";

export type BoundingBox
	= [Longitude, Latitude, Altitude, Longitude, Latitude, Altitude]
	| [Longitude, Latitude, Longitude, Latitude];
const isBoundingBoxWithAltitude = all(
	isTuple(isLongitude, isLatitude, isAltitude, isLongitude, isLatitude, isAltitude),
	([, s, , , n]) => s <= n
)
const isBoundingBoxWithoutAltitude = all(
	isTuple(isLongitude, isLatitude, isLongitude, isLatitude),
	([, s, , n]) => s <= n
)
export const isBoundingBox = any<BoundingBox>(
	isBoundingBoxWithAltitude,
	isBoundingBoxWithoutAltitude
);
export const isStrictBoundingBox = any<BoundingBox>(
	all(
		isTuple(isStrictLongitude, isStrictLatitude, isStrictAltitude, isStrictLongitude, isStrictLatitude, isStrictAltitude),
		isBoundingBoxWithAltitude
	),
	all(
		isTuple(isStrictLongitude, isStrictLatitude, isStrictLongitude, isStrictLatitude),
		isBoundingBoxWithoutAltitude
	),
);
