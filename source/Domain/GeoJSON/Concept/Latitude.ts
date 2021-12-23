import { isNumberBetween, isNumberValue } from "../../Guards/Number";

export type Latitude = number;
export function isLatitude(value: any): value is Latitude {
	return isNumberValue(value);
}
export const isStrictLatitude = isNumberBetween<Latitude>(-90, 90);
