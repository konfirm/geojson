import { isNumberBetween, isNumberValue } from "../../Guards/Number";

export type Longitude = number;
export function isLongitude(value: any): value is Longitude {
	return isNumberValue(value);
}
export const isStrictLongitude = isNumberBetween<Longitude>(-180, 180);
