import type { GeoJSON } from '../GeoJSON/GeoJSON';
import type { LineString } from '../GeoJSON/Geometry/LineString';
import type { Point } from '../GeoJSON/Geometry/Point';
import type { Polygon } from '../GeoJSON/Geometry/Polygon';
import { IterablePairIterator } from '../Iterator/IterablePair';
import { SimpleGeometryIterator } from '../Iterator/SimpleGeometry';
import { unwrapPath } from './Antimeridian';
import {
	type BoundaryDecision,
	getDistanceOfPointToPoint,
	isLinesCrossing,
	isPointInRing,
	isPointOnLine,
} from './Calculate';
import { segments } from './Segments';

export type BoundaryConvention =
	| 'include'
	| 'exclude'
	| 'winding'
	| BoundaryDecision;

const SAME_POSITION_THRESHOLD = 1e-14;

function isSamePosition(
	a: Point['coordinates'],
	b: Point['coordinates'],
): boolean {
	return (
		getDistanceOfPointToPoint(a, b, 'cartesian') < SAME_POSITION_THRESHOLD
	);
}

// The GPU rasterizer "top-left" fill rule, adapted to longitude/latitude:
// an edge owns the points on it if it heads south, or heads east along a
// line of constant latitude. Reversing a ring's winding reverses every
// edge's direction, so this flips which side of a shared boundary each
// ring claims, unlike 'include'/'exclude', it responds to winding.
function isInclusiveEdge(
	a: Point['coordinates'],
	b: Point['coordinates'],
): boolean {
	const [, unwrappedB] = unwrapPath([a, b]);
	const deltaLatitude = b[1] - a[1];
	const deltaLongitude = unwrappedB[0] - a[0];

	return deltaLatitude < 0 || (deltaLatitude === 0 && deltaLongitude > 0);
}

// A vertex is shared by two edges; it only belongs to this ring if both
// of them do, the same way a shared corner in a tiled mesh is only drawn
// by the one triangle whose edges are both top-left, otherwise either
// every ring sharing the vertex claims it (double count) or none do (gap).
const winding: BoundaryDecision = (point, ring, index) => {
	const n = ring.length - 1;
	const vertex = (i: number) => ring[((i % n) + n) % n];
	const a = ring[index];
	const b = ring[index + 1];

	if (!isSamePosition(point, a) && !isSamePosition(point, b)) {
		return isInclusiveEdge(a, b);
	}

	const v = isSamePosition(point, a) ? index : index + 1;

	return (
		isInclusiveEdge(vertex(v - 1), vertex(v)) &&
		isInclusiveEdge(vertex(v), vertex(v + 1))
	);
};

const BOUNDARY_CONVENTIONS: Record<
	'include' | 'exclude' | 'winding',
	BoundaryDecision
> = {
	include: () => true,
	exclude: () => false,
	winding,
};

function resolveBoundary(boundary: BoundaryConvention): BoundaryDecision {
	return typeof boundary === 'function'
		? boundary
		: BOUNDARY_CONVENTIONS[boundary];
}

const geometries = {
	PointPoint(a: Point['coordinates'], b: Point['coordinates']): boolean {
		return (
			a.length >= 2 &&
			b.length >= 2 &&
			a.slice(0, 2).every((v, i) => v === b[i])
		);
	},
	LineStringPoint(
		a: LineString['coordinates'],
		b: Point['coordinates'],
	): boolean {
		return (
			a.some((a) => this.PointPoint(a, b)) ||
			segments(a).some((line) => isPointOnLine(b, line))
		);
	},
	LineStringLineString(
		a: LineString['coordinates'],
		b: LineString['coordinates'],
	): boolean {
		const lines = segments(b);

		return segments(a).some((a) =>
			lines.some((b) => isLinesCrossing(a, b)),
		);
	},
	PolygonPoint(
		[exterior, ...interior]: Polygon['coordinates'],
		b: Point['coordinates'],
		boundary: BoundaryDecision,
	): boolean {
		return (
			isPointInRing(b, exterior, boundary) &&
			(!interior.length ||
				interior.every((ring) => !isPointInRing(b, ring, boundary)))
		);
	},
	PolygonLineString(
		a: Polygon['coordinates'],
		b: LineString['coordinates'],
		boundary: BoundaryDecision,
	): boolean {
		return (
			a.some((ring) => this.LineStringLineString(ring, b)) ||
			b.some((point) => this.PolygonPoint(a, point, boundary))
		);
	},
	PolygonPolygon(
		a: Polygon['coordinates'],
		b: Polygon['coordinates'],
		boundary: BoundaryDecision,
	): boolean {
		return (
			b.some(
				(b1) =>
					this.PolygonLineString(a, b1, boundary) ||
					b1.some((b2) => this.PolygonPoint(a, b2, boundary)),
			) ||
			a.some(
				(a1) =>
					this.PolygonLineString(b, a1, boundary) ||
					a1.some((a2) => this.PolygonPoint(b, a2, boundary)),
			)
		);
	},
};

export function intersect(
	a: GeoJSON,
	b: GeoJSON,
	options?: { boundary?: BoundaryConvention },
): boolean {
	const boundary = resolveBoundary(options?.boundary ?? 'include');
	const lookup = <
		Record<
			string,
			(a: unknown, b: unknown, boundary: BoundaryDecision) => boolean
		>
	>geometries;

	for (const [itA, itB] of new IterablePairIterator(
		new SimpleGeometryIterator(a),
		new SimpleGeometryIterator(b),
	)) {
		if (
			(itA.type + itB.type in lookup &&
				lookup[itA.type + itB.type](
					itA.coordinates,
					itB.coordinates,
					boundary,
				)) ||
			(itB.type + itA.type in lookup &&
				lookup[itB.type + itA.type](
					itB.coordinates,
					itA.coordinates,
					boundary,
				))
		) {
			return true;
		}
	}

	return false;
}
