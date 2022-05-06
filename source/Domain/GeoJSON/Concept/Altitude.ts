import { EARTH_RADIUS, GPS_SATELLITE_ORBIT } from "../../Constants";
import { isNumberBetween, isNumberValue } from "../../Guards/Number";

export type Altitude = number;
export function isAltitude(value: any): value is Altitude {
	return isNumberValue(value);
}

export const isStrictAltitude = isNumberBetween<Altitude>(-EARTH_RADIUS, GPS_SATELLITE_ORBIT);
