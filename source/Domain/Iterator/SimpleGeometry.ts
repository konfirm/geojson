import { LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from "../../main";
import { Feature } from "../GeoJSON/Feature";
import { FeatureCollection } from "../GeoJSON/FeatureCollection";
import { GeoJSON } from "../GeoJSON/GeoJSON";
import { GeometryCollection } from "../GeoJSON/GeometryCollection";

type SimpleGeometry = Point | LineString | Polygon;

/**
 * Iterator class to turn any GeoJSON structure into one or more SimpleGeometry (Point | LineString | Polygon) objects
 *
 * @export
 * @class SimpleGeometryIterator
 */
export class SimpleGeometryIterator {
    private readonly inputs: Array<GeoJSON> = [];

    /**
     *  Creates an instance of SimpleGeometryIterator
     * 
     * @param {...[GeoJSON, ...Array<GeoJSON>]} inputs
     * @memberof SimpleGeometryIterator
     */
    constructor(...inputs: [GeoJSON, ...Array<GeoJSON>]) {
        this.inputs = inputs;
    }

    /**
     * Generator yielding all SimpleGeometry objects from the provided GeoJSON structure(s)
     *
     * @return {*}  {Iterator<SimpleGeometry>}
     * @memberof SimpleGeometryIterator
     */
    *[Symbol.iterator](): Iterator<SimpleGeometry> {
        for (const input of this.inputs) {
            for (const simple of this.unwrap(input)) {
                yield simple;
            }
        }
    }

    /**
     * unwrap any GeoJSON object into one or more SimpleGeometry object
     *
     * @private
     * @param {GeoJSON} geo
     * @return {*}  {Iterable<SimpleGeometry>}
     * @memberof SimpleGeometryIterator
     */
    private *unwrap(geo: GeoJSON): Iterable<SimpleGeometry> {
        geo.type in this
            ? yield* this[geo.type](geo)
            : yield geo as SimpleGeometry;
    }

    /**
     * Generate the geometries in a GeometryCollection
     *
     * @private
     * @param {GeometryCollection} { geometries }
     * @return {*}  {Iterable<SimpleGeometry>}
     * @memberof SimpleGeometryIterator
     */
    private *GeometryCollection({ geometries }: GeometryCollection): Iterable<SimpleGeometry> {
        for (const geometry of geometries) {
            yield* this.unwrap(geometry);
        }
    }

    /**
     * Generate the geometries of the Feature object(s) in a FeatureCollection
     *
     * @private
     * @param {FeatureCollection} { features }
     * @return {*}  {Iterable<SimpleGeometry>}
     * @memberof SimpleGeometryIterator
     */
    private *FeatureCollection({ features }: FeatureCollection): Iterable<SimpleGeometry> {
        for (const { geometry } of features) {
            yield* this.unwrap(geometry);
        }
    }

    /**
     * Generate the geometry of a Feature object
     *
     * @private
     * @param {Feature} { geometry }
     * @return {*}  {Iterable<SimpleGeometry>}
     * @memberof SimpleGeometryIterator
     */
    private *Feature({ geometry }: Feature): Iterable<SimpleGeometry> {
        yield* this.unwrap(geometry);
    }

    /**
     * Generate Point objects from a MultiPoint object
     *
     * @private
     * @param {MultiPoint} multi
     * @return {*}  {Iterable<Point>}
     * @memberof SimpleGeometryIterator
     */
    private *MultiPoint(multi: MultiPoint): Iterable<Point> {
        for (const coordinates of multi.coordinates) {
            yield { type: 'Point', coordinates };
        }
    }

    /**
     * Generate LineString objects from a MultiLineString object
     *
     * @private
     * @param {MultiLineString} multi
     * @return {*}  {Iterable<LineString>}
     * @memberof SimpleGeometryIterator
     */
    private *MultiLineString(multi: MultiLineString): Iterable<LineString> {
        for (const coordinates of multi.coordinates) {
            yield { type: 'LineString', coordinates };
        }
    }

    /**
     * Generate Polygon objects from a MultiPolygon object
     *
     * @private
     * @param {MultiPolygon} multi
     * @return {*}  {Iterable<Polygon>}
     * @memberof SimpleGeometryIterator
     */
    private *MultiPolygon(multi: MultiPolygon): Iterable<Polygon> {
        for (const coordinates of multi.coordinates) {
            yield { type: 'Polygon', coordinates };
        }
    }
}
