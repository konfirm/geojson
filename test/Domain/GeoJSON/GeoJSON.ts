import * as Export from '../../../source/Domain/GeoJSON/GeoJSON';
import { runner } from '../../helper/geometry';

const types = [
	'Point',
	'MultiPoint',
	'LineString',
	'MultiLineString',
	'Polygon',
	'MultiPolygon',
	'GeometryCollection',
	'Feature',
	'FeatureCollection',
]

runner(
	'Domain/GeoJSON/GeoJSON',
	Export,
	['isGeoJSON', types],
	['isStrictGeoJSON', types],
);
