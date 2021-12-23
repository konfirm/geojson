import { any } from "@konfirm/guard";
import { isTuple } from "../../Guards/Tuple";
import { Altitude, isAltitude, isStrictAltitude } from "./Altitude";
import { isLatitude, isStrictLatitude, Latitude } from "./Latitude";
import { isLongitude, isStrictLongitude, Longitude } from "./Longitude";

export type Position = [Longitude, Latitude, Altitude?];
export const isPosition = any<Position>(
	isTuple(isLongitude, isLatitude),
	isTuple(isLongitude, isLatitude, isAltitude)
);
export const isStrictPosition = any<Position>(
	isTuple(isStrictLongitude, isStrictLatitude),
	isTuple(isStrictLongitude, isStrictLatitude, isStrictAltitude),
);
export function isEquivalentPosition(one: any, two: any): boolean {
	return isPosition(one) && isPosition(two) && one.length === two.length && one.every((v, i) => v === two[i]);
}
