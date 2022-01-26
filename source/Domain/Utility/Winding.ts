import { isArrayOfType } from "@konfirm/guard";
import { isPosition, Position } from "../GeoJSON/Concept/Position";

function winding(positions: Array<Position>): number {
	return positions.reduce((carry, [x, y], i, a) => {
		const [nx, ny] = a[(i + 1) % a.length];

		return carry + ((nx - x) * (ny + y));
	}, 0);
}

const isPositionArray = isArrayOfType<Array<Position>>(isPosition);

export function isClockwiseWinding<T extends Array<Position>>(value: any): value is T {
	return isPositionArray(value) && winding(value) <= 0;
}
export function isCounterClockwiseWinding<T extends Array<Position>>(value: any): value is T {
	return isPositionArray(value) && winding(value) >= 0;
}
