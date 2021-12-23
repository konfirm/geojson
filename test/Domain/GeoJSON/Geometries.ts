import test from 'tape';
import * as Export from '../../../source/Domain/GeoJSON/Geometries';
import { runner } from '../../helper/geometry';

runner(
	test,
	'Domain/GeoJSON/Geometries',
	Export,
	['isGeometries', ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']],
	['isStrictGeometries', ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']],
);
