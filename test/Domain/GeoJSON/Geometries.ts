import * as Export from '../../../source/Domain/GeoJSON/Geometries';
import { runner } from '../../helper/geometry';

runner(
	'Domain/GeoJSON/Geometries',
	Export,
	['isGeometries', ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']],
	['isStrictGeometries', ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']],
);
