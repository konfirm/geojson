import { Point } from "../../source/Domain/GeoJSON/Geometry/Point";
import { MultiPoint } from "../../source/Domain/GeoJSON/Geometry/MultiPoint";
import { LineString } from "../../source/Domain/GeoJSON/Geometry/LineString";
import { MultiLineString } from "../../source/Domain/GeoJSON/Geometry/MultiLineString";
import { Polygon } from "../../source/Domain/GeoJSON/Geometry/Polygon";
import { MultiPolygon } from "../../source/Domain/GeoJSON/Geometry/MultiPolygon";
import { GeometryCollection } from "../../source/Domain/GeoJSON/GeometryCollection";
import { Feature } from "../../source/Domain/GeoJSON/Feature";
import { FeatureCollection } from "../../source/Domain/GeoJSON/FeatureCollection";

export const point: Point = {
	type: 'Point',
	coordinates: [5.911738872528076, 51.97496770044958]
};
export const multipoint: MultiPoint = {
	type: 'MultiPoint',
	coordinates: [
		[5.90837001800537, 51.97143834257323],
		[5.911073684692383, 51.9743596661051],
		[5.912296772003173, 51.97550963714963],
		[5.913434028625488, 51.97669923130859],
		[5.914957523345947, 51.97794166259651],
	],
};
export const linestring: LineString = {
	type: 'LineString',
	coordinates: multipoint.coordinates,
}
export const multilinestring: MultiLineString = {
	type: 'MultiLineString',
	coordinates: [
		linestring.coordinates,
		[
			[5.9014177322387695, 51.9811401037613],
			[5.901675224304199, 51.98059823516843],
			[5.899229049682617, 51.97844391227356],
			[5.898284912109375, 51.97762444937298],
		]
	],
};
export const polygon: Polygon = {
	type: 'Polygon',
	coordinates: [
		[
			[5.913562774658203, 51.981827342304214],
			[5.913991928100586, 51.981060806327854],
			[5.914270877838134, 51.98021495830347],
			[5.9151506423950195, 51.9792369266152],
			[5.9154510498046875, 51.97985811137786],
			[5.915493965148926, 51.98059823516843],
			[5.9151506423950195, 51.98143085981622],
			[5.914850234985352, 51.98211809389835],
			[5.913562774658203, 51.981827342304214]
		]
	]
};
export const multipolygon: MultiPolygon = {
	type: 'MultiPolygon',
	coordinates: [[
		[
			[5.913562774658203, 51.981827342304214],
			[5.913991928100586, 51.981060806327854],
			[5.914270877838134, 51.98021495830347],
			[5.9151506423950195, 51.9792369266152],
			[5.9154510498046875, 51.97985811137786],
			[5.915493965148926, 51.98059823516843],
			[5.9151506423950195, 51.98143085981622],
			[5.914850234985352, 51.98211809389835],
			[5.913562774658203, 51.981827342304214]
		]
	],
	[
		[
			[5.911159515380859, 51.98404757938432],
			[5.911331176757812, 51.98421937885664],
			[5.910944938659668, 51.984364747126214],
			[5.908627510070801, 51.98458940625121],
			[5.906803607940674, 51.98449689968914],
			[5.90665340423584, 51.98433831656684],
			[5.906867980957031, 51.98423259417338],
			[5.907554626464844, 51.98439117767001],
			[5.908541679382324, 51.984364747126214],
			[5.90989351272583, 51.98427224010017],
			[5.911159515380859, 51.98404757938432]
		]
	]]
};
export const geometrycollection: GeometryCollection = {
	type: 'GeometryCollection',
	geometries: [
		point,
		multipoint,
		linestring,
		multilinestring,
		polygon,
		multipolygon,
	],
};
export const feature: Feature = {
	type: 'Feature',
	properties: null,
	geometry: point,
}
export const featurecollection: FeatureCollection = {
	type: 'FeatureCollection',
	features: geometrycollection.geometries.map((geometry) => ({ type: 'Feature', properties: null, geometry })),
};
