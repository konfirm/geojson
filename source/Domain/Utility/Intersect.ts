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

export function intersect(a: GeoJSON, b: GeoJSON): boolean {
	for (const [itA, itB] of new IterablePairIterator(new SimpleGeometryIterator(a), new SimpleGeometryIterator(b))) {
		if ((itA.type + itB.type in geometries && geometries[itA.type + itB.type](itA.coordinates, itB.coordinates)) || (itB.type + itA.type in geometries && geometries[itB.type + itA.type](itB.coordinates, itA.coordinates))) {
			return true;
		}
	}

	return false;
}
