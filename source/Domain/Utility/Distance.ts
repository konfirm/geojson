import { GeodesicConvergenceError } from '../GeoJSON/Error/GeodesicConvergenceError';
import { SelfIntersectingRingError } from '../GeoJSON/Error/SelfIntersectingRingError';
import type { GeoJSON } from '../GeoJSON/GeoJSON';
import type { LineString } from '../GeoJSON/Geometry/LineString';
import type { Point } from '../GeoJSON/Geometry/Point';
import { isPolygon, type Polygon } from '../GeoJSON/Geometry/Polygon';
import { IterablePairIterator } from '../Iterator/IterablePair';
import type { GeometryPath } from '../Iterator/SimpleGeometry';
import { SimpleGeometryIterator } from '../Iterator/SimpleGeometry';
import {
	cartesian as cartesianCoords,
	getDistanceOfLineToLine,
	getDistanceOfPointToLine,
	getDistanceOfPointToPoint,
	haversine as haversineCoords,
	isPointInRing,
	type PointToPointCalculation,
	vincenty as vincentyCoords,
} from './Calculate';
import { karney as karneyCoords } from './Geodesic';
import { segments } from './Segments';

// Internal-only marker for disambiguating which side of a PolygonPolygon
// check was mid-ring-test when a SelfIntersectingRingError is thrown.
// PolygonPolygon calls PolygonLineString twice (a-as-polygon, then
// b-as-polygon) and is the only place that knows which one failed —
// distance() reads this to know which side's path to attach, then discards
// it; it's never part of the error's public shape (a Symbol, same reasoning
// as SimpleGeometry.ts's COMPUTED_INDEX: it can't collide with anything and
// won't leak into JSON.stringify or deepStrictEqual comparisons).
const POLYGON_SIDE = Symbol('which side of a PolygonPolygon check threw');
type MarkedError = SelfIntersectingRingError & {
	[POLYGON_SIDE]?: 'a' | 'b';
};

const geometries = {
	PointPoint(
		a: Point['coordinates'],
		b: Point['coordinates'],
		calculation: PointToPointCalculation,
	): number {
		return getDistanceOfPointToPoint(a, b, calculation);
	},
	LineStringPoint(
		a: LineString['coordinates'],
		b: Point['coordinates'],
		calculation: PointToPointCalculation,
	): number {
		return Math.min(
			...segments(a).map((line) =>
				getDistanceOfPointToLine(b, line, calculation),
			),
		);
	},
	LineStringLineString(
		a: LineString['coordinates'],
		b: LineString['coordinates'],
		calculation: PointToPointCalculation,
	): number {
		const sa = segments(a);
		const sb = segments(b);

		return sa.reduce(
			(carry, a) =>
				sb.reduce(
					(carry, b) =>
						carry > 0
							? Math.min(
									carry,
									getDistanceOfLineToLine(a, b, calculation),
								)
							: carry,
					carry,
				),
			Infinity,
		);
	},
	PolygonPoint(
		[exterior, ...interior]: Polygon['coordinates'],
		b: Point['coordinates'],
		calculation: PointToPointCalculation,
	): number {
		if (isPointInRing(b, exterior)) {
			const [excluded] = interior.filter((ring) =>
				isPointInRing(b, ring),
			);

			return excluded
				? this.LineStringPoint(excluded, b, calculation)
				: 0;
		}

		return this.LineStringPoint(exterior, b, calculation);
	},
	PolygonLineString(
		a: Polygon['coordinates'],
		b: LineString['coordinates'],
		calculation: PointToPointCalculation,
	): number {
		const [exterior, ...interior] = a;
		const line = segments(b);
		const ring = b.some((b) => isPointInRing(b, exterior))
			? interior.find((a) => b.every((b) => isPointInRing(b, a)))
			: exterior;

		return ring
			? Math.min(
					...segments(ring).map((a) =>
						Math.min(
							...line.map((b) =>
								getDistanceOfLineToLine(a, b, calculation),
							),
						),
					),
				)
			: 0;
	},
	PolygonPolygon(
		a: Polygon['coordinates'],
		b: Polygon['coordinates'],
		calculation: PointToPointCalculation,
	): number {
		let aDistance: number;

		try {
			aDistance = this.PolygonLineString(a, b[0], calculation);
		} catch (error) {
			if (error instanceof SelfIntersectingRingError) {
				(<MarkedError>error)[POLYGON_SIDE] = 'a';
			}

			throw error;
		}

		let bDistance: number;

		try {
			bDistance = this.PolygonLineString(b, a[0], calculation);
		} catch (error) {
			if (error instanceof SelfIntersectingRingError) {
				(<MarkedError>error)[POLYGON_SIDE] = 'b';
			}

			throw error;
		}

		return Math.min(aDistance, bDistance);
	},
};

export function cartesian(a: GeoJSON, b: GeoJSON, radius?: number): number {
	return distance(a, b, (pa, pb) => cartesianCoords(pa, pb, radius));
}

export function haversine(a: GeoJSON, b: GeoJSON, radius?: number): number {
	return distance(a, b, (pa, pb) => haversineCoords(pa, pb, radius));
}

export function vincenty(a: GeoJSON, b: GeoJSON): number {
	return distance(a, b, vincentyCoords);
}

export function karney(a: GeoJSON, b: GeoJSON): number {
	return distance(a, b, karneyCoords);
}

export function distance(
	a: GeoJSON,
	b: GeoJSON,
	calculation: PointToPointCalculation = 'haversine',
): number {
	const lookup = <
		Record<
			string,
			(
				a: unknown,
				b: unknown,
				calculation: PointToPointCalculation,
			) => number
		>
	>geometries;
	// Materialized rather than passed as the live .paths() generators:
	// IterablePairIterator re-iterates each side once per element of the
	// other side, which only works against something re-iterable (an array,
	// or SimpleGeometryIterator's own default iterator) — a generator
	// object is single-use and would silently yield nothing on the 2nd+
	// pass.
	const aPaths = [...new SimpleGeometryIterator(a).paths()];
	const bPaths = [...new SimpleGeometryIterator(b).paths()];

	return Math.min(
		...[...new IterablePairIterator(aPaths, bPaths)].map(
			([[a, aPath], [b, bPath]]) => {
				try {
					return a.type + b.type in lookup
						? lookup[a.type + b.type](
								a.coordinates,
								b.coordinates,
								calculation,
							)
						: b.type + a.type in lookup
							? lookup[b.type + a.type](
									b.coordinates,
									a.coordinates,
									calculation,
								)
							: Infinity;
				} catch (error) {
					attachPathToSelfIntersectingRingError(error, [
						[a, aPath],
						[b, bPath],
					]);
					attachPathToGeodesicConvergenceError(error, [
						[a, aPath],
						[b, bPath],
					]);

					throw error;
				}
			},
		),
	);
}

// PolygonPoint/PolygonLineString are unambiguous by construction (their
// first parameter is always the polygon side), so only the PolygonPolygon
// case needs the POLYGON_SIDE marker at all
function attachPathToSelfIntersectingRingError(
	error: unknown,
	sides: [[GeoJSON, GeometryPath], [GeoJSON, GeometryPath]],
): void {
	if (!(error instanceof SelfIntersectingRingError)) {
		return;
	}

	const [[a, aPath], [b, bPath]] = sides;
	const side = (<MarkedError>error)[POLYGON_SIDE];
	const isSideA = side ? side === 'a' : isPolygon(a);
	const [geometry, path] = isSideA ? [a, aPath] : [b, bPath];

	error.path = [...path, geometry];
}

// Unlike SelfIntersectingRingError, there's no ambiguity to resolve
function attachPathToGeodesicConvergenceError(
	error: unknown,
	sides: [[GeoJSON, GeometryPath], [GeoJSON, GeometryPath]],
): void {
	if (!(error instanceof GeodesicConvergenceError)) {
		return;
	}

	const [[a, aPath], [b, bPath]] = sides;

	error.path = [...aPath, a];
	error.counterpart = [...bPath, b];
}
