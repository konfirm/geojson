import { Feature, LineString, MultiPoint, Polygon } from '../../source/main';

// Source: © OpenStreetMap contributors — https://www.openstreetmap.org/relation/36989
// License: ODbL — https://opendatacommons.org/licenses/odbl/
// Verify: https://nominatim.openstreetmap.org/lookup?osm_ids=R36989&format=json&polygon_geojson=1
// Feature: Holy See — geometry: Polygon — winding: RFC 7946-compliant (CCW exterior, CW holes)
export const coordinates: MultiPoint['coordinates'] = [
	[12.4457878, 41.9019669],
	[12.4465468, 41.9016406],
	[12.4467233, 41.9017975],
	[12.4479728, 41.901002],
	[12.4477919, 41.9008499],
	[12.4479497, 41.9006923],
	[12.448775, 41.9008166],
	[12.4487752, 41.9009986],
	[12.4508676, 41.900827],
	[12.4508389, 41.9005862],
	[12.4518065, 41.9003561],
	[12.452791, 41.9002848],
	[12.4528348, 41.900491],
	[12.4545155, 41.9002048],
	[12.4543254, 41.901403],
	[12.4562631, 41.9016731],
	[12.4567992, 41.901259],
	[12.4575536, 41.9011984],
	[12.4582774, 41.9016549],
	[12.4583653, 41.9022574],
	[12.4581939, 41.9028709],
	[12.4575538, 41.903253],
	[12.4567462, 41.9031888],
	[12.4561843, 41.9027564],
	[12.4566816, 41.9032032],
	[12.4575579, 41.9033324],
	[12.4576569, 41.9058208],
	[12.4556582, 41.9062965],
	[12.4554001, 41.9073829],
	[12.453829, 41.9069806],
	[12.453883, 41.9068006],
	[12.4514347, 41.9063716],
	[12.4513711, 41.9065751],
	[12.4505145, 41.9064855],
	[12.4503233, 41.9059883],
	[12.4505185, 41.9058394],
	[12.4494506, 41.9050402],
	[12.4492722, 41.9051795],
	[12.4489405, 41.9050442],
	[12.4488888, 41.9047274],
	[12.4491049, 41.9046784],
	[12.4486477, 41.9036102],
	[12.4483873, 41.9037046],
	[12.4479072, 41.9034179],
	[12.4476422, 41.9031239],
	[12.4478558, 41.9029913],
	[12.4468736, 41.9021876],
	[12.4466245, 41.9023518]
];
export const multipoint: MultiPoint = {
	type: 'MultiPoint',
	coordinates,
};
export const linestring: LineString = {
	type: 'LineString',
	coordinates,
};
export const polygon: Polygon = {
	type: 'Polygon',
	coordinates: [[...coordinates, coordinates[0]]],
};
export const feature: Feature = {
	type: 'Feature',
	properties: { name: 'Holy See' },
	geometry: polygon,
};
