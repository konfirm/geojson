import { any } from "@konfirm/guard";
import { isTuple } from "../../Guards/Tuple";
import { Altitude, isAltitude, isStrictAltitude } from "./Altitude";
import { isLatitude, isStrictLatitude, Latitude } from "./Latitude";
import { isLongitude, isStrictLongitude, Longitude } from "./Longitude";

export type Position = [Longitude, Latitude, Altitude?];
export const isPosition = any(
	isTuple(isLongitude, isLatitude),
	isTuple(isLongitude, isLatitude, isAltitude)
);
export const isStrictPosition = any(
	isTuple(isStrictLongitude, isStrictLatitude),
	isTuple(isStrictLongitude, isStrictLatitude, isStrictAltitude),
);
