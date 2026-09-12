import { all, isNumber, isStructure } from '@konfirm/guard';
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
import { isGeometryPrimitive, type GeometryCollection } from '../GeoJSON/Geometry';

type SimpleGeometry = Point | LineString | Polygon;
type UnwrapGeometry = Exclude<GeoJSON, SimpleGeometry>;

// A SimpleGeometry we create ourselves by unwrapping the Multi* coordinates to
// its singular counterpart, e.g. MultiPoint coordinates are an array of single
// Point coordinates. We simply make this into that singular type for each of
// the multi-coordinates array.
// The synthesized object carries the index in which it was when we created it.
// The index' presence therefor indicates it's a synthetic object we make
export const SYNTH_INDEX = Symbol('Multi* coordinate index');

export type Synthesized<G extends SimpleGeometry> = G & {
	readonly [SYNTH_INDEX]: number;
};

export const isSynthesizedGeometry = all<Synthesized<SimpleGeometry>>(
	isGeometryPrimitive,
	isStructure({ [SYNTH_INDEX]: isNumber }),
);

// The chain of GeoJSON objects a SimpleGeometry was found inside, outside in
// (e.g. FeatureCollection -> Feature -> MultiPolygon -> Polygon)
export type GeometryPath = Array<GeoJSON>;

type Unwrap = (geo: GeoJSON) => Iterable<[SimpleGeometry, GeometryPath]>;

type Reducer = {
	[K in UnwrapGeometry['type']]: (
		geo: Extract<UnwrapGeometry, { type: K }>,
		unwrap: Unwrap,
	) => Iterable<[SimpleGeometry, GeometryPath]>;
};

const reducers: Reducer = {
	*MultiPoint({ coordinates, ...rest }: MultiPoint, unwrap) {
		for (const [index, pair] of coordinates.entries()) {
			yield* unwrap(<Synthesized<Point>>{
				coordinates: pair,
				...rest,
				type: 'Point',
				[SYNTH_INDEX]: index,
			});
		}
	},
	*MultiLineString({ coordinates, ...rest }: MultiLineString, unwrap) {
		for (const [index, pair] of coordinates.entries()) {
			yield* unwrap(<Synthesized<LineString>>{
				coordinates: pair,
				...rest,
				type: 'LineString',
				[SYNTH_INDEX]: index,
			});
		}
	},
	*MultiPolygon({ coordinates, ...rest }: MultiPolygon, unwrap) {
		for (const [index, pair] of coordinates.entries()) {
			yield* unwrap(<Synthesized<Polygon>>{
				coordinates: pair,
				...rest,
				type: 'Polygon',
				[SYNTH_INDEX]: index,
			});
		}
	},
	*GeometryCollection({ geometries }: GeometryCollection, unwrap) {
		for (const geometry of geometries) {
			yield* unwrap(geometry);
		}
	},
	*Feature({ geometry }: Feature, unwrap) {
		if (geometry) {
			yield* unwrap(geometry);
		}
	},
	*FeatureCollection({ features }: FeatureCollection, unwrap) {
		for (const feature of features) {
			yield* unwrap(feature);
		}
	},
};

/**
 * Iterator class to turn any GeoJSON structure into one or more SimpleGeometry
 * (Point | LineString | Polygon) objects
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
		for (const [simple] of this.paths()) {
			if (isSynthesizedGeometry(simple)) {
				const { [SYNTH_INDEX]: _, ...geometry } = simple;

				yield <SimpleGeometry>geometry;
			} else {
				yield simple;
			}
		}
	}

	/**
	 * Generator yielding every SimpleGeometry alongside the chain of GeoJSON
	 * objects it was found inside
	 *
	 * @return {*}  {Iterable<[SimpleGeometry, GeometryPath]>}
	 * @memberof SimpleGeometryIterator
	 */
	*paths(): Iterable<[SimpleGeometry, GeometryPath]> {
		for (const input of this.inputs) {
			yield* this.unwrap(input, []);
		}
	}

	/**
	 * unwrap any GeoJSON object into one or more [SimpleGeometry, GeometryPath] pairs
	 *
	 * @private
	 * @param {GeoJSON} geo
	 * @param {GeometryPath} path
	 * @return {*}  {Iterable<[SimpleGeometry, GeometryPath]>}
	 * @memberof SimpleGeometryIterator
	 */
	private *unwrap(
		geo: GeoJSON,
		path: GeometryPath,
	): Iterable<[SimpleGeometry, GeometryPath]> {
		if (geo.type in reducers) {
			const nested = [...path, geo];

			yield* (<Reducer[keyof Reducer]>reducers[<keyof Reducer>geo.type])(
				<never>geo,
				(g: GeoJSON) => this.unwrap(g, nested),
			);
		} else {
			yield [<SimpleGeometry>geo, path];
		}
	}
}
