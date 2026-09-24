import type { GeoJSON } from '../GeoJSON/GeoJSON';
import type { LineString } from '../GeoJSON/Geometry/LineString';
import type { Point } from '../GeoJSON/Geometry/Point';
import type { Polygon } from '../GeoJSON/Geometry/Polygon';
import { IterablePairIterator } from '../Iterator/IterablePair';
import { SimpleGeometryIterator } from '../Iterator/SimpleGeometry';
import {
	type BoundaryDecision,
	isLinesCrossing,
	isPointInRing,
	isPointOnLine,
} from './Calculate';
import { segments } from './Segments';

export type BoundaryConvention = 'include' | 'exclude' | BoundaryDecision;

const BOUNDARY_CONVENTIONS: Record<'include' | 'exclude', BoundaryDecision> = {
	include: () => true,
	exclude: () => false,
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
