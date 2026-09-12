import type { Position } from '../GeoJSON/Concept/Position';
import { SelfIntersectingRingError } from '../GeoJSON/Error/SelfIntersectingRingError';

type SpherePosition = [number, number, number];

// Fixed, arbitrary, non-grid-aligned reference point — the same "point at
// infinity" trick S2 (and, via a vendored S2 snapshot, MongoDB's 2dsphere
// index) uses to anchor an otherwise-relative crossing count. Deliberately
// not a pole or a round number, to avoid coinciding with typical data.
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

// Orientation predicate: sign of the scalar triple product. This is the
// spherical analogue of the 2D "which side of line AB is point C on"
// cross-product test.
function sign(a: SpherePosition, b: SpherePosition, c: SpherePosition): number {
	return Math.sign(dot(a, cross(b, c)));
}

// The exact edge-crossing predicate from S2's own source (confirmed against
// s2edge_crosser.h, and against MongoDB's vendored s2edgeutil.h under the
// name RobustCrossing — same test, different filename): edges (A,B) and
// (C,D) cross iff all four triangle orientations agree and are nonzero. An
// earlier, simpler two-pair "each straddles the other's great circle" test
// looks plausible but is insufficient — it produces false positives for
// long test arcs.
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

// A ring is self-intersecting if any two non-adjacent edges cross — reuses
// arcsCross rather than inventing new geometry for this. Adjacent edges
// (including the wrap-around pair at the closing vertex) share an endpoint
// by construction and are excluded, not checked. Returns the crossing pair
// of edge indices (into the same array `ring` this was called with), or
// null when the ring is simple — the indices, not just a boolean, are what
// let the caller construct a SelfIntersectingRingError naming the actual
// crossing edges rather than just reporting that *something* crossed.
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

// A point believed to be in the ring's smaller region: the vertex centroid
// (unit-vector average, normalized). Reasonably-shaped rings have their
// centroid inside their own smaller region; this is a heuristic, not a
// proof — a pathologically non-star-shaped ring could in principle defeat
// it.
//
// Degenerate case: a ring whose vertices all share one latitude (e.g. a
// circle of latitude) has vertices that are coplanar with the sphere's
// center, so *any* subset average cancels toward zero regardless of which
// vertices are chosen. Falls back to nudging the first edge's midpoint
// along that edge's own normal, which — verified against both winding
// directions — lands correctly on that edge's near side.
function centroid(ring: Array<SpherePosition>): SpherePosition {
	const sum = ring.reduce(
		([sx, sy, sz], [x, y, z]) => [sx + x, sy + y, sz + z],
		[0, 0, 0] as SpherePosition,
	);

	if (Math.sqrt(dot(sum, sum)) >= 1e-6) {
		return normalize(sum);
	}

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

// findSelfIntersection is O(n²) in the ring's edge count and would
// otherwise re-run from scratch on every call against the same ring — real
// polygons (e.g. a detailed country boundary) can have hundreds of
// vertices, and a caller checking many points against one ring pays that
// cost every time. Cached by value (the ring's own coordinates, not the
// array's identity): stringifying is itself a cheap O(n) copy, so a caller
// mutating their ring array in place naturally produces a different key
// next time (no stale hit), while two distinct arrays holding the same
// coordinates collapse to the same entry (better reuse than reference
// identity would give). Caches the crossing indices, not an Error instance
// — constructing a fresh SelfIntersectingRingError on every call, cache hit
// or not, avoids a single shared, mutable error object being handed out to
// unrelated callers who each expect to enrich their own copy. Traded off
// deliberately: entries are never evicted, so a process checking an
// unbounded number of distinct rings over its lifetime would grow this
// without bound — acceptable for the expected usage (a bounded set of
// rings queried repeatedly), revisit if that assumption stops holding.
const selfIntersectionCache = new Map<string, [number, number] | null>();

// Spherical point-in-ring containment via crossing-count parity, replacing
// flat-plane ray-casting (which has no way to resolve a ring large/
// ambiguous enough that "which side is inside" isn't decided by the ring's
// shape alone — see issue #18). Matches this library's existing behaviour
// for ordinary rings and MongoDB's own default (non-strict-winding)
// convention for large/ambiguous ones.
//
// A `'winding'` mode (always trust the ring's own traversal direction,
// matching MongoDB's strictwinding CRS opt-in) is deliberately not
// implemented here yet — comparing against a fixed reference point only
// gives you *a* consistent answer, not necessarily the winding-implied one,
// and that hasn't been designed or validated. Don't add it speculatively;
// see plan/spherical-polygon-containment.md.
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

	return (
		crossingCount(p, vertices) % 2 ===
		crossingCount(centroid(vertices), vertices) % 2
	);
}
