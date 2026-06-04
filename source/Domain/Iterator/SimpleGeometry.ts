import type {
	LineString,
	MultiLineString,
	MultiPoint,
	MultiPolygon,
	Point,
	Polygon,
} from '../../main';
import type { Feature } from '../GeoJSON/Feature';
import type { FeatureCollection } from '../GeoJSON/FeatureCollection';
import type { GeoJSON } from '../GeoJSON/GeoJSON';
import type { GeometryCollection } from '../GeoJSON/Geometry';

type SimpleGeometry = Point | LineString | Polygon;
type UnwrapGeometry = Exclude<GeoJSON, SimpleGeometry>;

type Reducer = {
	[K in UnwrapGeometry['type']]: (
		geo: Extract<UnwrapGeometry, { type: K }>,
		unwrap: (geo: GeoJSON) => Iterable<SimpleGeometry>,
	) => Iterable<SimpleGeometry>;
};

const reducers: Reducer = {
	*MultiPoint(
		{ coordinates, ...rest }: MultiPoint,
		unwrap,
	): Iterable<SimpleGeometry> {
		for (const pair of coordinates) {
			yield* unwrap(<Point>{
				coordinates: pair,
				...rest,
				type: 'Point',
			});
		}
	},
	*MultiLineString(
		{ coordinates, ...rest }: MultiLineString,
		unwrap,
	): Iterable<SimpleGeometry> {
		for (const pair of coordinates) {
			yield* unwrap(<LineString>{
				coordinates: pair,
				...rest,
				type: 'LineString',
			});
		}
	},
	*MultiPolygon(
		{ coordinates, ...rest }: MultiPolygon,
		unwrap,
	): Iterable<SimpleGeometry> {
		for (const pair of coordinates) {
			yield* unwrap(<Polygon>{
				coordinates: pair,
				...rest,
				type: 'Polygon',
			});
		}
	},
	*GeometryCollection(
		{ geometries }: GeometryCollection,
		unwrap,
	): Iterable<SimpleGeometry> {
		for (const geometry of geometries) {
			yield* unwrap(geometry);
		}
	},
	*Feature({ geometry }: Feature, unwrap): Iterable<SimpleGeometry> {
		if (geometry) {
			yield* unwrap(geometry);
		}
	},
	*FeatureCollection(
		{ features }: FeatureCollection,
		unwrap,
	): Iterable<SimpleGeometry> {
		for (const { geometry } of features) {
			if (geometry) {
				yield* unwrap(geometry);
			}
		}
	},
};

/**
 * Iterator class to turn any GeoJSON structure into one or more SimpleGeometry (Point | LineString | Polygon) objects
 *
 * @export
 * @class SimpleGeometryIterator
 */
export class SimpleGeometryIterator {
	private readonly inputs: Array<GeoJSON> = [];

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
		type Invoke = (
			geo: GeoJSON,
			unwrap: (geo: GeoJSON) => Iterable<SimpleGeometry>,
		) => Iterable<SimpleGeometry>;
		geo.type in reducers
			? yield* (<Invoke>reducers[<keyof Reducer>geo.type])(
					geo,
					(g: GeoJSON): Iterable<SimpleGeometry> => this.unwrap(g),
				)
			: yield <SimpleGeometry>geo;
	}
}
