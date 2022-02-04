import { Point } from '../GeoJSON/Geometry/Point';
import { LineString } from '../GeoJSON/Geometry/LineString';
import { Polygon } from '../GeoJSON/Geometry/Polygon';
import { GeoJSON } from '../GeoJSON/GeoJSON';
import { segments } from './Segments';
import { isLinesCrossing, isPointInRing, isPointOnLine } from "./Calculate";
import { SimpleGeometryIterator } from "../Iterator/SimpleGeometry";
import { IterablePairIterator } from "../Iterator/IterablePair";

const geometries = {
	PointPoint(a: Point['coordinates'], b: Point['coordinates']): boolean {
		return a.length >= 2 && b.length >= 2 && a.slice(0, 2).every((v, i) => v === b[i]);
	},
	LineStringPoint(a: LineString['coordinates'], b: Point['coordinates']): boolean {
		return a.some((a) => this.PointPoint(a, b)) || segments(a).some((line) => isPointOnLine(b, line));
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

export function intersect(...shapes: [GeoJSON, GeoJSON]): boolean {
	for (const [a, b] of new IterablePairIterator(...shapes.map((shape) => new SimpleGeometryIterator(shape)))) {
		if ((a.type + b.type in geometries && geometries[a.type + b.type](a.coordinates, b.coordinates)) || (b.type + a.type in geometries && geometries[b.type + a.type](b.coordinates, a.coordinates))) {
			return true;
		}
	}

	return false;
}
