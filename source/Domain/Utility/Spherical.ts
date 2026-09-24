import { isClosedRing } from '../GeoJSON/Concept/LinearRing';
import type { Position } from '../GeoJSON/Concept/Position';
import { SelfIntersectingRingError } from '../GeoJSON/Error/SelfIntersectingRingError';

type SpherePosition = [number, number, number];

// Fixed point far from any likely data — the same "point at
// infinity" trick S2 (as used by MongoDB's 2dsphere index) uses to anchor an
// otherwise-relative crossing count. Not a pole, not a round number,
// on purpose.
const ORIGIN_POSITION: Position = [37.294613, 12.847291];
// Float noise around an exact hemisphere tie (2*PI) computes a few ULPs
// off, not exactly on it; this absorbs that without hiding any tie
// anyone would actually care about
const HEMISPHERE_TIE_EPSILON = 1e-9;
const FULL_SPHERE = 4 * Math.PI;
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

// Area of the ring's own traversal-implied ("left of travel") side, in
// steradians, always in [0, 4*PI) — never negative. A small counter-
// clockwise ring's own (small, obviously-enclosed) interior is on its
// left, so this comes out small; the same shape wound clockwise has its
// *complement* on the left instead, so this comes out close to 4*PI, not
// negative.
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

	return (
		(((2 * Math.PI - totalTurning) % FULL_SPHERE) + FULL_SPHERE) %
		FULL_SPHERE
	);
}

// findSelfIntersection is O(n²) and re-running it per point against the
// same ring gets old fast, real polygons run to hundreds of vertices.
// Keyed by the ring's coordinates, not array identity: mutating your ring
// in place gives a new key (no stale hits), identical rings in different
// arrays share an entry.
const selfIntersectionCache = new Map<string, [number, number] | null>();

function getSelfIntersection(
	key: string,
	vertices: Array<SpherePosition>,
): [number, number] | null {
	let crossing = selfIntersectionCache.get(key);

	if (crossing === undefined) {
		crossing = findSelfIntersection(vertices);
		selfIntersectionCache.set(key, crossing);
	}

	return crossing;
}

// Removes any vertex equal to its cyclic predecessor — including across
// the ring's own closing wrap — collapsing a zero-length edge (a vertex
// listed twice in a row) down to one. arcsCross can never register a
// crossing against a zero-length edge (its two "endpoints" are the same
// point), so crossingCount/turningAngle silently treat it as if it
// weren't there — this makes that explicit instead of leaving a blind
// spot for a ring that's only *partially* degenerate (issue #29; #27 was
// the fully-degenerate case, every vertex the same point).
function withoutZeroLengthEdges(open: Array<Position>): Array<Position> {
	return open.filter(
		(vertex, i) =>
			JSON.stringify(vertex) !==
			JSON.stringify(open[(i - 1 + open.length) % open.length]),
	);
}

// Area of a ring's own traversal-implied side, at the Position level.
// Returns null for fewer than 3 distinct vertices: a point or
// a line segment doesn't enclose anything
export function orientedRingArea(ring: Array<Position>): number | null {
	const open = isClosedRing(ring) ? ring.slice(0, -1) : ring;
	const vertices = open.map(toSpherePosition);

	// A self-intersecting ("bowtie") ring has no single left/right side —
	// Gauss-Bonnet assumes a simple closed curve and produces some
	// specific-looking but meaningless number for one that crosses itself,
	// not a natural tie the way a flat shoelace sum's own cancellation
	// happens to land on exactly 0 for a *balanced* self-crossing shape.
	if (getSelfIntersection(JSON.stringify(ring), vertices)) return null;

	const distinct = withoutZeroLengthEdges(open);

	if (distinct.length < 3) return null;

	return signedRingArea(distinct.map(toSpherePosition));
}

// Unsigned ring area in steradians, 0 to 4*PI (whole sphere). This is the
// ring's literal, as-wound area — unlike isPositionInSphericalRing/intersect(),
// it does not correct for winding, so reversing a ring's vertex order can
// change the result. Fewer than 3 distinct vertices: reported as 0 which
// differs from orientedRingArea.
export function ringArea(ring: Array<Position>): number {
	const area = orientedRingArea(ring);

	return area === null ? 0 : Math.abs(area);
}

// Whether a ring's own as-wound area covers more than half the sphere. A thin
// wrapper over ringArea()
export function exceedsHemisphere(ring: Array<Position>): boolean {
	return ringArea(ring) > 2 * Math.PI + HEMISPHERE_TIE_EPSILON;
}

// Point-in-ring via crossing-count parity, done on the sphere
export function isPositionInSphericalRing(
	position: Position,
	ring: Array<Position>,
): boolean {
	const open = ring.slice(0, -1);
	const vertices = open.map(toSpherePosition);
	const crossing = getSelfIntersection(JSON.stringify(ring), vertices);

	if (crossing) {
		const [i, j] = crossing;

		throw new SelfIntersectingRingError(
			'Ring is self-intersecting',
			[ring[i], ring[i + 1]],
			[ring[j], ring[j + 1]],
		);
	}

	const distinct = withoutZeroLengthEdges(open).map(toSpherePosition);

	if (distinct.length < 3) return false;

	const p = toSpherePosition(position);
	const reference = edgeReference(distinct);
	const sameSideAsReference =
		crossingCount(p, distinct) % 2 ===
		crossingCount(reference, distinct) % 2;

	// edgeReference sits on the ring's traversal side. If that side is the
	// bigger one (over a hemisphere), the smaller-region rule makes the
	// *other* side inside: flip. Ties drop through and winding decides.
	return exceedsHemisphere(ring) ? !sameSideAsReference : sameSideAsReference;
}
