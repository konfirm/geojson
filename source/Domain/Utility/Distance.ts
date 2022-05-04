import { GeoJSON } from '../GeoJSON/GeoJSON';
import { Point } from '../GeoJSON/Geometry/Point';
import { LineString } from '../GeoJSON/Geometry/LineString';
import { Polygon } from '../GeoJSON/Geometry/Polygon';
import { segments } from './Segments';
import { SimpleGeometryIterator } from '../Iterator/SimpleGeometry';
import { IterablePairIterator } from '../Iterator/IterablePair';
import { getDistanceOfLineToLine, getDistanceOfPointToLine, getDistanceOfPointToPoint, isPointInRing, PointToPointCalculation } from './Calculate';

const geometries = {
    PointPoint(a: Point['coordinates'], b: Point['coordinates'], calculation: PointToPointCalculation): number {
        return getDistanceOfPointToPoint(a, b, calculation);
    },
    LineStringPoint(a: LineString['coordinates'], b: Point['coordinates'], calculation: PointToPointCalculation): number {
        return Math.min(...segments(a).map((line) => getDistanceOfPointToLine(b, line, calculation)));
    },
    LineStringLineString(a: LineString['coordinates'], b: LineString['coordinates'], calculation: PointToPointCalculation): number {
        const sa = segments(a);
        const sb = segments(b);

        return sa.reduce((carry, a) => sb.reduce((carry, b) => carry > 0 ? Math.min(carry, getDistanceOfLineToLine(a, b, calculation)) : carry, carry), Infinity);
    },
    PolygonPoint([exterior, ...interior]: Polygon['coordinates'], b: Point['coordinates'], calculation: PointToPointCalculation): number {
        if (isPointInRing(b, exterior)) {
            const [excluded] = interior.filter((ring) => isPointInRing(b, ring));

            return excluded ? this.LineStringPoint(excluded, b, calculation) : 0;
        }

        return this.LineStringPoint(exterior, b, calculation);
    },
    PolygonLineString(a: Polygon['coordinates'], b: LineString['coordinates'], calculation: PointToPointCalculation): number {
        const [exterior, ...interior] = a;
        const line = segments(b);
        const ring = b.some((b) => isPointInRing(b, exterior))
            ? interior.find((a) => b.every((b) => isPointInRing(b, a)))
            : exterior;

        return ring
            ? Math.min(...segments(ring).map((a) => Math.min(...line.map((b) => getDistanceOfLineToLine(a, b, calculation)))))
            : 0;
    },
    PolygonPolygon(a: Polygon['coordinates'], b: Polygon['coordinates'], calculation: PointToPointCalculation): number {
        return Math.min(this.PolygonLineString(a, b[0], calculation), this.PolygonLineString(b, a[0], calculation));
    },
};

export function distance(a: GeoJSON, b: GeoJSON, calculation: PointToPointCalculation = 'direct'): number {
    return Math.min(...[...new IterablePairIterator(new SimpleGeometryIterator(a), new SimpleGeometryIterator(b))].map(([a, b]) => {
        return a.type + b.type in geometries
            ? geometries[a.type + b.type](a.coordinates, b.coordinates, calculation)
            : b.type + a.type in geometries
                ? geometries[b.type + a.type](b.coordinates, a.coordinates, calculation)
                : Infinity
    }));
}
