import { isNumberBetween, isNumberValue } from "../../Guards/Number";

export type Altitude = number;
export function isAltitude(value: any): value is Altitude {
	return isNumberValue(value);
}

const EARTH_RADIUS = 6_378_137;
const GPS_SATELLITE_ORBIT = 20_180_000;
export const isStrictAltitude = isNumberBetween<Altitude>(-EARTH_RADIUS, GPS_SATELLITE_ORBIT);
