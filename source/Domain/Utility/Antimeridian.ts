import type { Position } from '../GeoJSON/Concept/Position';

// Longitude arithmetic (bounding boxes, ray casting, line intersection,
// shoelace winding) reads a raw coordinate pair like 179° and -179° as
// ~358° apart, going the long way through 0°, instead of the true ~2° hop
// across ±180° (RFC 7946 §3.1.9). The functions below remove that jump.

// The representative of `longitude` within 180° of `anchor`.
function nearestLongitude(longitude: number, anchor: number): number {
	return anchor + (((((longitude - anchor + 180) % 360) + 360) % 360) - 180);
}

function shiftLongitude<T extends Position>(position: T, offset: number): T {
	return offset === 0
		? position
		: ([position[0] + offset, ...position.slice(1)] as T);
}

// Walks a path (ring or line) and removes any >180° longitude jump between
// consecutive points, keeping each point close to its immediate neighbour
// rather than to one fixed reference. This stays correct no matter how far
// the path's overall longitude span drifts from its first point.
export function unwrapPath<T extends Position>(path: Array<T>): Array<T> {
	let offset = 0;

	return path.map((position, index) => {
		if (index > 0) {
			const delta = position[0] - path[index - 1][0];

			if (delta > 180) offset -= 360;
			else if (delta < -180) offset += 360;
		}

		return shiftLongitude(position, offset);
	});
}

// Brings an already internally-consistent path into the same frame as
// `anchor`, by adding a single shared multiple of 360° to every point.
// Unlike remapping each point independently, this can't reintroduce a
// jump inside a path whose points are already close to each other.
export function alignPath<T extends Position>(
	path: Array<T>,
	anchor: number,
): Array<T> {
	const offset = nearestLongitude(path[0][0], anchor) - path[0][0];

	return path.map((position) => shiftLongitude(position, offset));
}

export function alignPosition<T extends Position>(
	position: T,
	anchor: number,
): T {
	return shiftLongitude(
		position,
		nearestLongitude(position[0], anchor) - position[0],
	);
}
