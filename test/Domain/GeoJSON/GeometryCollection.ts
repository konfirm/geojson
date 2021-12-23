import test from 'tape';
import * as Export from '../../../source/Domain/GeoJSON/GeometryCollection';
import { runner } from '../../helper/geometry';

runner(
	test,
	'Domain/GeoJSON/GeometryCollection',
	Export,
	'isGeometryCollection',
	'isStrictGeometryCollection',
);
