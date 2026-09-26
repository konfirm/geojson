import {
	EARTH_FLATTENING,
	EARTH_RADIUS,
	EARTH_RADIUS_MAJOR,
	EARTH_RADIUS_MINOR,
} from '../Constants';
import { GeodesicConvergenceError } from '../GeoJSON/Error/GeodesicConvergenceError';
import { UnknownCalculationError } from '../GeoJSON/Error/UnknownCalculationError';
import type { Point } from '../GeoJSON/Geometry/Point';
import { alignPath, alignPosition, unwrapPath } from './Antimeridian';
import { karney } from './Geodesic';
import { squared } from './Numeric';
import { isPositionInSphericalRing } from './Spherical';

const D2R = Math.PI / 180;
const π = Math.PI;

function constrain(value: number, min: number, max: number): number {
	return Math.max(Math.min(value, max), min);
}

function rad(n: number): number {
	return n * D2R;
}

const EARTH_RADIUS_MAJOR_SQUARED = squared(EARTH_RADIUS_MAJOR);
const EARTH_RADIUS_MINOR_SQUARED = squared(EARTH_RADIUS_MINOR);
const EARTH_RADIUS_FACTOR =
	(EARTH_RADIUS_MAJOR_SQUARED - EARTH_RADIUS_MINOR_SQUARED) /
	EARTH_RADIUS_MINOR_SQUARED;
const EARTH_INVERSE_FLATTENING = 1 / EARTH_FLATTENING;

export function cartesian(
	[λa, φa]: Point['coordinates'],
	[λb, φb]: Point['coordinates'],
	radius: number = EARTH_RADIUS,
): number {
	return radius * rad(Math.sqrt(squared(λb - λa) + squared(φb - φa)));
}

export function haversine(
	[λa, φa]: Point['coordinates'],
	[λb, φb]: Point['coordinates'],
	radius: number = EARTH_RADIUS,
): number {
	//https://www.movable-type.co.uk/scripts/latlong.html
	const Δ =
		squared(Math.sin(rad(φb - φa) / 2)) +
		Math.cos(rad(φa)) *
			Math.cos(rad(φb)) *
			squared(Math.sin(rad(λb - λa) / 2));

	return radius * Math.atan2(Math.sqrt(Δ), Math.sqrt(1 - Δ)) * 2;
}

export function vincenty(
	a: Point['coordinates'],
	b: Point['coordinates'],
): number {
	//https://www.movable-type.co.uk/scripts/latlong-vincenty.html
	const [[λ1, φ1], [λ2, φ2]] = [a, b].map((p) => (<Array<number>>p).map(rad));
	const L = λ2 - λ1; // L = difference in longitude, U = reduced latitude, defined by tan U = (1-f)·tanφ.
	const tanU1 = (1 - EARTH_INVERSE_FLATTENING) * Math.tan(φ1),
		cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1),
		sinU1 = tanU1 * cosU1;
	const tanU2 = (1 - EARTH_INVERSE_FLATTENING) * Math.tan(φ2),
		cosU2 = 1 / Math.sqrt(1 + tanU2 * tanU2),
		sinU2 = tanU2 * cosU2;

	const antipodal = Math.abs(L) > π / 2 || Math.abs(φ2 - φ1) > π / 2;

	let λ = L;
	let sinλ = null;
	let cosλ = null; // λ = difference in longitude on an auxiliary sphere
	let σ = antipodal ? π : 0;
	let sinσ = 0;
	let cosσ = antipodal ? -1 : 1;
	let sinSqσ = null; // σ = angular distance P₁ P₂ on the sphere
	let cos2σₘ = 1; // σₘ = angular distance on the sphere from the equator to the midpoint of the line
	let cosSqα = 1; // α = azimuth of the geodesic at the equator
	let λʹ = null;
	let prevΔλ = Infinity;
	let iterations = 0;

	do {
		sinλ = Math.sin(λ);
		cosλ = Math.cos(λ);
		sinSqσ =
			(cosU2 * sinλ) ** 2 + (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) ** 2;
		if (Math.abs(sinSqσ) < 1e-24) break; // co-incident/antipodal points (σ < ≈0.006mm)
		sinσ = Math.sqrt(sinSqσ);
		cosσ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
		σ = Math.atan2(sinσ, cosσ);
		const sinα = (cosU1 * cosU2 * sinλ) / sinσ;
		cosSqα = 1 - sinα * sinα;
		cos2σₘ = cosSqα !== 0 ? cosσ - (2 * sinU1 * sinU2) / cosSqα : 0; // on equatorial line cos²α = 0 (§6)
		const C =
			(EARTH_INVERSE_FLATTENING / 16) *
			cosSqα *
			(4 + EARTH_INVERSE_FLATTENING * (4 - 3 * cosSqα));
		λʹ = λ;
		λ =
			L +
			(1 - C) *
				EARTH_INVERSE_FLATTENING *
				sinα *
				(σ +
					C *
						sinσ *
						(cos2σₘ + C * cosσ * (-1 + 2 * cos2σₘ * cos2σₘ)));
		const Δλ = Math.abs(λ - λʹ);
		// 2-cycle detection (floating-point fixed point) or hard iteration cap
		if ((Δλ !== 0 && Δλ === prevΔλ) || ++iterations > 1000)
			throw new GeodesicConvergenceError(
				'Vincenty formula failed to converge',
			);
		prevΔλ = Δλ;
	} while (Math.abs(λ - λʹ) > 1e-12); // TV: 'iterate until negligible change in λ' (≈0.006mm)

	const uSq = cosSqα * EARTH_RADIUS_FACTOR;
	const A =
		1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
	const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
	const Δσ =
		B *
		sinσ *
		(cos2σₘ +
			(B / 4) *
				(cosσ * (-1 + 2 * cos2σₘ * cos2σₘ) -
					(B / 6) *
						cos2σₘ *
						(-3 + 4 * sinσ * sinσ) *
						(-3 + 4 * cos2σₘ * cos2σₘ)));

	return EARTH_RADIUS_MINOR * A * (σ - Δσ);
}

const PointToPoint: {
	[key: string]: (a: Point['coordinates'], b: Point['coordinates']) => number;
} = {
	cartesian,
	haversine,
	vincenty,
	karney,
};

export type PointToPointCalculation =
	| 'cartesian'
	| 'haversine'
	| 'vincenty'
	| 'karney'
	| ((a: Point['coordinates'], b: Point['coordinates']) => number);

export function getClosestPointOnLineByPoint(
	point: Point['coordinates'],
	line: [Point['coordinates'], Point['coordinates']],
): Point['coordinates'] {
	const unwrappedLine = unwrapPath(line);
	const [[ax, ay], [bx, by]] = unwrappedLine;
	const [abx, aby] = [bx - ax, by - ay];

	// Zero-length line (both endpoints coincide): the projection below
	// divides by zero (0/0 = NaN). The closest (only) point on it is
	// the point itself.
	if (abx === 0 && aby === 0) return unwrappedLine[0];

	const [px, py] = alignPosition(point, ax);
	const [apx, apy] = [px - ax, py - ay];
	const t = constrain(
		(apx * abx + apy * aby) / (abx * abx + aby * aby),
		0,
		1,
	);

	return t === 0 || t === 1 ? unwrappedLine[t] : [ax + abx * t, ay + aby * t];
}

export function getDistanceOfPointToPoint(
	a: Point['coordinates'],
	b: Point['coordinates'],
	calculation: PointToPointCalculation,
): number {
	const calc =
		typeof calculation === 'function'
			? calculation
			: PointToPoint[calculation];

	if (typeof calc === 'function') {
		return calc(a, b);
	}

	throw new UnknownCalculationError(
		`Not a PointToPoint calculation function ${calculation}`,
	);
}

export function getDistanceOfPointToLine(
	point: Point['coordinates'],
	line: [Point['coordinates'], Point['coordinates']],
	calculation: PointToPointCalculation,
): number {
	const closest = getClosestPointOnLineByPoint(point, line);
	const aligned =
		Math.abs(point[0] - closest[0]) > 180
			? alignPosition(point, closest[0])
			: point;

	return getDistanceOfPointToPoint(aligned, closest, calculation);
}

export function getDistanceOfLineToLine(
	a: [Point['coordinates'], Point['coordinates']],
	b: [Point['coordinates'], Point['coordinates']],
	calculation: PointToPointCalculation,
): number {
	return isLinesCrossing(a, b)
		? 0
		: Math.min(
				...a.map((a) => getDistanceOfPointToLine(a, b, calculation)),
				...b.map((b) => getDistanceOfPointToLine(b, a, calculation)),
			);
}

// How far from exactly parallel (sin of the angle between direction
// vectors, scale-independent) still counts as "parallel" for the
// collinear-overlap fallback below. Not a fixed distance — an absolute
// threshold on the raw cross product would be wrong at both ends (too
// loose for short segments, too tight for long ones).
const PARALLEL_EPSILON = 1e-9;
// Float-noise tolerance, in meters, for "this point is exactly on that
// line" once the lines are already known to be collinear. Looser than
// isPointOnLine's own default (1e-14 m, meant for near bit-exact
// matches like a ring's own repeated vertex) because two independently-
// computed collinear points land ~1e-9-1e-10 m apart in practice, not
// 1e-14 — still five to six orders of magnitude tighter than any real
// GPS/survey precision, so it can't swallow genuinely distinct points.
const COLLINEAR_POINT_THRESHOLD = 1e-6;

export type LineCrossingParameters = { s: number; t: number };

// The raw parametric solution for where (infinite extensions of) `a` and
// `b` cross, in antimeridian-safe coordinates — null when the lines are
// parallel/collinear (or one is a degenerate point), since that case has
// no single intersection point at all (a whole shared stretch, or none).
// Exported so callers that need to distinguish a genuine transversal
// crossing from a mere touch (s/t exactly 0 or 1) can do so directly,
// rather than just getting isLinesCrossing's touch-inclusive boolean.
export function getLineCrossingParameters(
	a: [Point['coordinates'], Point['coordinates']],
	b: [Point['coordinates'], Point['coordinates']],
): LineCrossingParameters | null {
	const ua = unwrapPath(a);
	const ub = alignPath(unwrapPath(b), ua[0][0]);
	const [[a1x, a1y], [a2x, a2y]] = ua;
	const [[b1x, b1y], [b2x, b2y]] = ub;
	const [s1x, s1y, s2x, s2y] = [a2x - a1x, a2y - a1y, b2x - b1x, b2y - b1y];
	const denominator = -s2x * s1y + s1x * s2y;
	const length1 = Math.sqrt(s1x * s1x + s1y * s1y);
	const length2 = Math.sqrt(s2x * s2x + s2y * s2y);

	if (
		length1 === 0 ||
		length2 === 0 ||
		Math.abs(denominator / (length1 * length2)) < PARALLEL_EPSILON
	) {
		return null;
	}

	return {
		s: (-s1y * (a1x - b1x) + s1x * (a1y - b1y)) / denominator,
		t: (s2x * (a1y - b1y) - s2y * (a1x - b1x)) / denominator,
	};
}

export function isLinesCrossing(
	a: [Point['coordinates'], Point['coordinates']],
	b: [Point['coordinates'], Point['coordinates']],
): boolean {
	const parameters = getLineCrossingParameters(a, b);

	// Collinear/parallel (or one line is a degenerate point): fall back to
	// checking whether any endpoint of one line lies on the other — for
	// two collinear segments, any overlap is always bounded by one of the
	// four endpoints (interval math — the overlap of [a1,a2] and [b1,b2]
	// on a shared line starts/ends at max(a1,b1)/min(a2,b2), each always
	// one of the four original values).
	if (parameters === null) {
		return (
			isPointOnLine(a[0], b, COLLINEAR_POINT_THRESHOLD) ||
			isPointOnLine(a[1], b, COLLINEAR_POINT_THRESHOLD) ||
			isPointOnLine(b[0], a, COLLINEAR_POINT_THRESHOLD) ||
			isPointOnLine(b[1], a, COLLINEAR_POINT_THRESHOLD)
		);
	}

	const { s, t } = parameters;

	return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

export function isPointOnLine(
	point: Point['coordinates'],
	line: [Point['coordinates'], Point['coordinates']],
	threshold: number = 1e-14,
): boolean {
	return getDistanceOfPointToLine(point, line, 'cartesian') < threshold;
}

export type BoundaryDecision = (
	point: Point['coordinates'],
	ring: Array<Point['coordinates']>,
	index: number,
) => boolean;

export function isPointInRing(
	p: Point['coordinates'],
	ring: Array<Point['coordinates']>,
	boundary: BoundaryDecision = () => true,
): boolean {
	// Always run, self-intersecting rings must throw regardless of
	// where the query point falls relative to the boundary.
	const inside = isPositionInSphericalRing(p, ring);
	const index = ring
		.slice(1)
		.findIndex((a, i) => isPointOnLine(p, [ring[i], a]));

	return index === -1 ? inside : boundary(p, ring, index);
}
