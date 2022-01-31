import { Point } from "../GeoJSON/Geometry/Point";
import { LineString } from "../GeoJSON/Geometry/LineString";
import { Polygon } from "../GeoJSON/Geometry/Polygon";
import { GeometryCollection } from "../GeoJSON/GeometryCollection";
import { Feature } from "../GeoJSON/Feature";
import { FeatureCollection } from "../GeoJSON/FeatureCollection";
import { GeoJSON } from "../GeoJSON/GeoJSON";
import { Geometries } from "../GeoJSON/Geometries";
import { MultiPoint } from "../GeoJSON/Geometry/MultiPoint";
import { MultiLineString } from "../GeoJSON/Geometry/MultiLineString";
import { MultiPolygon } from "../GeoJSON/Geometry/MultiPolygon";

type CoordinateTypeArg
	= [Point['type'], MultiPoint['coordinates']]
	| [LineString['type'], MultiLineString['coordinates']]
	| [Polygon['type'], MultiPolygon['coordinates']]

function typeArgs(a: Geometries): CoordinateTypeArg {
	const pattern = /^(Multi)?(Point|LineString|Polygon)$/;
	const [, m, t] = a.type.match(pattern) || [];

	return [t, m ? a.coordinates : [a.coordinates]] as CoordinateTypeArg;
}

function segments(line: Array<Point['coordinates']>): Array<[Point['coordinates'], Point['coordinates']]> {
	return line.slice(1).map((point, index) => [line[index], point]);
}

function getDistanceOfPointToLine(...points: [Point['coordinates'], Point['coordinates'], Point['coordinates']]) {
	const [[px, py], [ax, ay], [bx, by]] = points;
	const L2 = (((bx - ax) * (bx - ax)) + ((by - ay) * (by - ay)));

	return L2 === 0
		? Infinity
		: Math.abs((((ay - py) * (bx - ax)) - ((ax - px) * (by - ay))) / L2) * Math.sqrt(L2);
}

function isPointOnLine(point: Point['coordinates'], ...line: [Point['coordinates'], Point['coordinates']]): boolean {
	return getDistanceOfPointToLine(point, ...line) < 1e-14;
}

function isLinesCrossing(a: [Point['coordinates'], Point['coordinates']], b: [Point['coordinates'], Point['coordinates']]): boolean {
	const [[a1x, a1y], [a2x, a2y]] = a;
	const [[b1x, b1y], [b2x, b2y]] = b;
	const [s1x, s1y, s2x, s2y] = [a2x - a1x, a2y - a1y, b2x - b1x, b2y - b1y];
	const s = (-s1y * (a1x - b1x) + s1x * (a1y - b1y)) / (-s2x * s1y + s1x * s2y);
	const t = (s2x * (a1y - b1y) - s2y * (a1x - b1x)) / (-s2x * s1y + s1x * s2y);

	return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

function isPointInRing(p: Point['coordinates'], ring: Array<Point['coordinates']>): boolean {
	const { length } = ring;
	const odd = ring
		.reduce((odd, a, i) => {
			const b = ring[(length + i - 1) % length];

			return (a[1] < p[1] && b[1] >= p[1] || b[1] < p[1] && a[1] >= p[1]) && (a[0] <= p[0] || b[0] <= p[0])
				? odd ^ Number(a[0] + (p[1] - a[1]) / (b[1] - a[1]) * (b[0] - a[0]) < p[0])
				: odd;
		}, 0);

	return odd !== 0;
}

const coordinates = {
	PointPoint(a: Point['coordinates'], b: Point['coordinates']): boolean {
		return a.length >= 2 && b.length >= 2 && a.slice(0, 2).every((v, i) => v === b[i]);
	},
	LineStringPoint(a: LineString['coordinates'], b: Point['coordinates']): boolean {
		return a.some((a) => this.PointPoint(a, b)) || segments(a).some((line) => isPointOnLine(b, ...line));
	},
	LineStringLineString(a: LineString['coordinates'], b: LineString['coordinates']): boolean {
		const lines = segments(b);

		return segments(a).some((a) => lines.some((b) => isLinesCrossing(a, b)));
	},
	PolygonPoint([exterior, ...interior]: Polygon['coordinates'], b: Point['coordinates']): boolean {
		return (this.LineStringPoint(exterior, b) || isPointInRing(b, exterior)) && (!interior.length || interior.every((ring) => !isPointInRing(b, ring)));
	},
	PolygonLineString(a: Polygon['coordinates'], b: LineString['coordinates']): boolean {
		return a.some((ring) => this.LineStringLineString(ring, b)) || b.some((point) => this.PolygonPoint(a, point));
	},
	PolygonPolygon(a: Polygon['coordinates'], b: Polygon['coordinates']): boolean {
		return b.some((b1) => this.PolygonLineString(a, b1) || b1.some((b2) => this.PolygonPoint(a, b2)))
			|| a.some((a1) => this.PolygonLineString(b, a1) || a1.some((a2) => this.PolygonPoint(b, a2)))
	},
};

const nested = {
	GeometryCollection({ geometries }: GeometryCollection) {
		return (evaluate: (a: Geometries | GeometryCollection) => boolean) => geometries.some((a) => evaluate(a));
	},
	FeatureCollection({ features }: FeatureCollection) {
		return (evaluate: (a: Geometries | GeometryCollection) => boolean) => features.some(({ geometry }) => evaluate(geometry));
	},
	Feature({ geometry: a }: Feature) {
		return (evaluate: (a: Geometries | GeometryCollection) => boolean) => evaluate(a);
	},
};

function coordinatesIntersects(a: Geometries, b: Geometries): boolean {
	const [ta, va] = typeArgs(a);
	const [tb, vb] = typeArgs(b);

	if (typeof coordinates[ta + tb] === 'function') {
		return va.some((a) => vb.some((b) => coordinates[ta + tb](a, b)));
	}
	if (typeof coordinates[tb + ta] === 'function') {
		return va.some((a) => vb.some((b) => coordinates[tb + ta](b, a)));
	}

	return false;
}

export function intersect(a: GeoJSON, b: GeoJSON): boolean {
	if (a.type in nested) {
		return nested[a.type](a)((a) => intersect(a, b));
	}
	if (b.type in nested) {
		return nested[b.type](b)((b) => intersect(a, b));
	}

	return coordinatesIntersects(a as Geometries, b as Geometries);
}
