import { isArrayOfType } from '@konfirm/guard';
import { isPosition, type Position } from '../GeoJSON/Concept/Position';
import { unwrapPath } from './Antimeridian';

// Standard shoelace formula: positive = CCW (RFC 7946 exterior), negative = CW (hole).
// Positions are unwrapped across the antimeridian first (RFC 7946 §3.1.9),
// otherwise a ring crossing ±180° computes a signed area for the wrong,
// near-globe-spanning shape and can come out with the opposite sign.
function shoelace(positions: Array<Position>): number {
	return unwrapPath(positions).reduce((carry, [x, y], i, a) => {
		const [nx, ny] = a[(i + 1) % a.length];

		return carry + (x * ny - nx * y);
	}, 0);
}

const isPositionArray = isArrayOfType<Array<Position>>(isPosition);

export function isClockwiseWinding<T extends Array<Position>>(
	value: unknown,
): value is T {
	return isPositionArray(value) && shoelace(value) <= 0;
}
export function isCounterClockwiseWinding<T extends Array<Position>>(
	value: unknown,
): value is T {
	return isPositionArray(value) && shoelace(value) >= 0;
}
