import { GeoJSON } from '../GeoJSON/GeoJSON';
import { Point } from '../GeoJSON/Geometry/Point';
import { LineString } from '../GeoJSON/Geometry/LineString';
import { Polygon } from '../GeoJSON/Geometry/Polygon';
import { segments } from './Segments';
import { SimpleGeometryIterator } from '../Iterator/SimpleGeometry';
import { IterablePairIterator } from '../Iterator/IterablePair';
import { getDistanceOfLineToLine, getDistanceOfPointToLine, getDistanceOfPointToPoint, isLinesCrossing, isPointInRing } from './Calculate';

const geometries = {
    PointPoint(a: Point['coordinates'], b: Point['coordinates']): number {
        return getDistanceOfPointToPoint(a, b);
    },
    LineStringPoint(a: LineString['coordinates'], b: Point['coordinates']): number {
        return Math.min(...segments(a).map((line) => getDistanceOfPointToLine(b, line)));
    },
    LineStringLineString(a: LineString['coordinates'], b: LineString['coordinates']): number {
        const sa = segments(a);
        const sb = segments(b);

        return sa.reduce((carry, a) => sb.reduce((carry, b) => carry > 0 ? Math.min(carry, getDistanceOfLineToLine(a, b)) : carry, carry), Infinity);
    },
    PolygonPoint([exterior, ...interior]: Polygon['coordinates'], b: Point['coordinates']): number {
        if (isPointInRing(b, exterior)) {
            const [excluded] = interior.filter((ring) => isPointInRing(b, ring));

            return excluded ? this.LineStringPoint(excluded, b) : 0;
        }

        return this.LineStringPoint(exterior, b);
    },
    PolygonLineString(a: Polygon['coordinates'], b: LineString['coordinates']): number {
        const [exterior, ...interior] = a;
        const line = segments(b);
        const ring = b.some((b) => isPointInRing(b, exterior))
            ? interior.find((a) => b.every((b) => isPointInRing(b, a)))
            : exterior;

        return ring
            ? Math.min(...segments(ring).map((a) => Math.min(...line.map((b) => getDistanceOfLineToLine(a, b)))))
            : 0;
    },
    PolygonPolygon(a: Polygon['coordinates'], b: Polygon['coordinates']): number {
        return Math.min(this.PolygonLineString(a, b[0]), this.PolygonLineString(b, a[0]));
    },
};

export function distance(a: GeoJSON, b: GeoJSON): number {
    return Math.min(...[...new IterablePairIterator(new SimpleGeometryIterator(a), new SimpleGeometryIterator(b))].map(([a, b]) => {
        return a.type + b.type in geometries
            ? geometries[a.type + b.type](a.coordinates, b.coordinates)
            : b.type + a.type in geometries
                ? geometries[b.type + a.type](b.coordinates, a.coordinates)
                : Infinity
    }));
}
