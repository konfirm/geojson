import { LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from "../../main";
import { Feature } from "../GeoJSON/Feature";
import { FeatureCollection } from "../GeoJSON/FeatureCollection";
import { GeoJSON } from "../GeoJSON/GeoJSON";
import { GeometryCollection } from "../GeoJSON/GeometryCollection";

type SimpleGeometry = Point | LineString | Polygon;

export class SimpleGeometryIterator {
    private readonly inputs: Array<GeoJSON> = [];

    constructor(...inputs: Array<GeoJSON>) {
        this.inputs = inputs;
    }

    *[Symbol.iterator](): Iterator<SimpleGeometry> {
        for (const input of this.inputs) {
            for (const simple of this.unwrap(input)) {
                yield simple;
            }
        }
    }

    private *unwrap(geo: GeoJSON): Iterable<SimpleGeometry> {
        geo.type in this
            ? yield* this[geo.type](geo)
            : yield geo as SimpleGeometry;
    }

    private *GeometryCollection({ geometries }: GeometryCollection): Iterable<SimpleGeometry> {
        for (const geometry of geometries) {
            yield* this.unwrap(geometry);
        }
    }

    private *FeatureCollection({ features }: FeatureCollection): Iterable<SimpleGeometry> {
        for (const { geometry } of features) {
            yield* this.unwrap(geometry);
        }
    }

    private *Feature({ geometry }: Feature): Iterable<SimpleGeometry> {
        yield* this.unwrap(geometry);
    }

    private *MultiPoint(multi: MultiPoint): Iterable<Point> {
        for (const coordinates of multi.coordinates) {
            yield { type: 'Point', coordinates };
        }
    }

    private *MultiLineString(multi: MultiLineString): Iterable<LineString> {
        for (const coordinates of multi.coordinates) {
            yield { type: 'LineString', coordinates };
        }
    }

    private *MultiPolygon(multi: MultiPolygon): Iterable<Polygon> {
        for (const coordinates of multi.coordinates) {
            yield { type: 'Polygon', coordinates };
        }
    }
}
