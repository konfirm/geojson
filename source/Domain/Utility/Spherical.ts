import type { Position } from '../GeoJSON/Concept/Position';
import { SelfIntersectingRingError } from '../GeoJSON/Error/SelfIntersectingRingError';

type SpherePosition = [number, number, number];

// Fixed point far from any likely data — the same "point at
// infinity" trick S2 (as used by MongoDB's 2dsphere index) uses to anchor an
// otherwise-relative crossing count. Not a pole, not a round number,
// on purpose.
const ORIGIN_POSITION: Position = [37.294613, 12.847291];
const D2R = Math.PI / 180;

function toSpherePosition([λ, φ]: Position): SpherePosition {
	const λr = λ * D2R;
	const φr = φ * D2R;
	const cosφ = Math.cos(φr);

	return [cosφ * Math.cos(λr), cosφ * Math.sin(λr), Math.sin(φr)];
}

const ORIGIN_SPHERE_POSITION = toSpherePosition(ORIGIN_POSITION);

function cross(
	[ax, ay, az]: SpherePosition,
	[bx, by, bz]: SpherePosition,
): SpherePosition {
	return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

function dot(
	[ax, ay, az]: SpherePosition,
	[bx, by, bz]: SpherePosition,
): number {
	return ax * bx + ay * by + az * bz;
}

function normalize([x, y, z]: SpherePosition): SpherePosition {
	const length = Math.sqrt(x * x + y * y + z * z);

	return [x / length, y / length, z / length];
}

// Sign of the scalar triple product
// The spherical version of the 2D "which side of line AB is C on" test.
function sign(a: SpherePosition, b: SpherePosition, c: SpherePosition): number {
	return Math.sign(dot(a, cross(b, c)));
}

// Edge-crossing test, lifted straight from S2: edges [A,B] and [C,D] cross if
// all four triangle orientations agree and none is zero..
function arcsCross(
	a: SpherePosition,
	b: SpherePosition,
	c: SpherePosition,
	d: SpherePosition,
): boolean {
	const acb = sign(a, c, b);

	return (
		acb !== 0 &&
		acb === sign(c, b, d) &&
		acb === sign(b, d, a) &&
		acb === sign(d, a, c)
	);
}

function crossingCount(
	point: SpherePosition,
	ring: Array<SpherePosition>,
): number {
	return ring.reduce(
		(count, a, i) =>
			count +
			Number(
				arcsCross(
					point,
					ORIGIN_SPHERE_POSITION,
					a,
					ring[(i + 1) % ring.length],
				),
			),
		0,
	);
}

// Self-intersection: any two non-adjacent edges cross.
// Returns the indices of the crossing edges so the caller can report
// *which* edges crossed, not just that something did.
function findSelfIntersection(
	ring: Array<SpherePosition>,
): [number, number] | null {
	const { length } = ring;

	for (let i = 0; i < length; i++) {
		for (let j = i + 1; j < length; j++) {
			if (j === i + 1 || (i === 0 && j === length - 1)) {
				continue;
			}

			if (
				arcsCross(
					ring[i],
					ring[(i + 1) % length],
					ring[j],
					ring[(j + 1) % length],
				)
			) {
				return [i, j];
			}
		}
	}

	return null;
}

// A point just off the first edge's midpoint, on the ring's own
// traversal side. Unlike averaging the vertices, this doesn't care what
// the rest of the ring looks like
// Known caveat: if some other edge runs within `epsilon` of this point,
// we lose
function edgeReference(ring: Array<SpherePosition>): SpherePosition {
	const [a, b] = ring;
	const midpoint = normalize([a[0] + b[0], a[1] + b[1], a[2] + b[2]]);
	const edgeNormal = normalize(cross(a, b));
	const epsilon = 1e-6;

	return normalize([
		midpoint[0] + edgeNormal[0] * epsilon,
		midpoint[1] + edgeNormal[1] * epsilon,
		midpoint[2] + edgeNormal[2] * epsilon,
	]);
}

// How much, and which way, the path bends at `v`: the angle between the
// two adjacent edges' plane normals, signed relative to `v` so left and
// right turns differ.
function turningAngle(
	previous: SpherePosition,
	v: SpherePosition,
	next: SpherePosition,
): number {
	const incoming = cross(previous, v);
	const outgoing = cross(v, next);

	return Math.atan2(
		dot(v, cross(incoming, outgoing)),
		dot(incoming, outgoing),
	);
}

// Area the ring encloses as traversed, in steradians
// Gauss-Bonnet: area = 2*PI minus total turning around the boundary.
// Negative if the ring is reversed.
function signedRingArea(ring: Array<SpherePosition>): number {
	const { length } = ring;
	const totalTurning = ring.reduce(
		(sum, v, i) =>
			sum +
			turningAngle(
				ring[(i - 1 + length) % length],
				v,
				ring[(i + 1) % length],
			),
		0,
	);

	return 2 * Math.PI - totalTurning;
}

// Unsigned ring area in steradians, 0 to 4*PI (whole sphere). Exported per
// issue #23 so consumers can copy MongoDB's "invert above a hemisphere"
// rule without redoing the math.
export function ringArea(ring: Array<Position>): number {
	return Math.abs(signedRingArea(ring.slice(0, -1).map(toSpherePosition)));
}

// findSelfIntersection is O(n²) and re-running it per point against the
// same ring gets old fast, real polygons run to hundreds of vertices.
// Keyed by the ring's coordinates, not array identity: mutating your ring
// in place gives a new key (no stale hits), identical rings in different
// arrays share an entry.
const selfIntersectionCache = new Map<string, [number, number] | null>();

// Point-in-ring via crossing-count parity, done on the sphere
export function isPositionInSphericalRing(
	position: Position,
	ring: Array<Position>,
): boolean {
	const vertices = ring.slice(0, -1).map(toSpherePosition);
	const key = JSON.stringify(ring);
	let crossing = selfIntersectionCache.get(key);

	if (crossing === undefined) {
		crossing = findSelfIntersection(vertices);
		selfIntersectionCache.set(key, crossing);
	}

	if (crossing) {
		const [i, j] = crossing;

		throw new SelfIntersectingRingError(
			'Ring is self-intersecting',
			[ring[i], ring[i + 1]],
			[ring[j], ring[j + 1]],
		);
	}

	const p = toSpherePosition(position);
	const reference = edgeReference(vertices);
	const sameSideAsReference =
		crossingCount(p, vertices) % 2 ===
		crossingCount(reference, vertices) % 2;

	// edgeReference sits on the ring's traversal side. If that side is the
	// bigger one (over a hemisphere), the smaller-region rule makes the
	// *other* side inside: flip. Ties drop through and winding decides.
	// The epsilon covers float noise around 2*PI without hiding any tie
	// anyone would actually care about.
	const referenceSideExceedsHemisphere = ringArea(ring) > 2 * Math.PI + 1e-9;

	return referenceSideExceedsHemisphere
		? !sameSideAsReference
		: sameSideAsReference;
}
