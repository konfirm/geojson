import { isArrayOfType } from '@konfirm/guard';
import { isPosition, type Position } from '../GeoJSON/Concept/Position';
import { orientedRingArea } from './Spherical';

const isPositionArray = isArrayOfType<Array<Position>>(isPosition);

// Counterclockwise means the ring's own interior is on its left, i.e. that
// side is at most a hemisphere; clockwise means the *complement* is on its
// left, i.e. that side is more than a hemisphere. 2*PI, not 0, is therefore the
// dividing line. A ring with fewer than 3 distinct vertices has no orientation
// at all.
export function isClockwiseWinding<T extends Array<Position>>(
	value: unknown,
): value is T {
	if (!isPositionArray(value)) return false;

	const area = orientedRingArea(value);

	return area === null || area >= 2 * Math.PI;
}
export function isCounterClockwiseWinding<T extends Array<Position>>(
	value: unknown,
): value is T {
	if (!isPositionArray(value)) return false;

	const area = orientedRingArea(value);

	return area === null || area <= 2 * Math.PI;
}
