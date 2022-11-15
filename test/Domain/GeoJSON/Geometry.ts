import * as Export from '../../../source/Domain/GeoJSON/Geometry';
import { runner } from '../../helper/geometry';

runner(
	'Domain/GeoJSON/Geometry',
	Export,
	['isGeometry', ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']],
	['isStrictGeometry', ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']],
);
