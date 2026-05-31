import { isArrayOfType } from '@konfirm/guard';
import { isPosition, type Position } from '../GeoJSON/Concept/Position';

// Standard shoelace formula: positive = CCW (RFC 7946 exterior), negative = CW (hole).
function shoelace(positions: Array<Position>): number {
    return positions.reduce((carry, [x, y], i, a) => {
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
