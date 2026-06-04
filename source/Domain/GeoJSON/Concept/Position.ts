import { any } from '@konfirm/guard';
import { isTuple } from '../../Guards/Tuple';
import { type Altitude, isAltitude, isStrictAltitude } from './Altitude';
import { isLatitude, isStrictLatitude, type Latitude } from './Latitude';
import { isLongitude, isStrictLongitude, type Longitude } from './Longitude';

export type Position = [Longitude, Latitude, Altitude?, ...Array<unknown>];
export const isPosition = any<Position>(
	isTuple(isLongitude, isLatitude),
	isTuple(isLongitude, isLatitude, isAltitude),
);
export const isStrictPosition = any<Position>(
	isTuple(isStrictLongitude, isStrictLatitude),
	isTuple(isStrictLongitude, isStrictLatitude, isStrictAltitude),
);
export function isEquivalentPosition(one: unknown, two: unknown): boolean {
	return (
		isPosition(one) &&
		isPosition(two) &&
		one.length === two.length &&
		one.every((v, i) => v === two[i])
	);
}
