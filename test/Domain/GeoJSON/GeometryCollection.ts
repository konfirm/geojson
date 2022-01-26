import * as Export from '../../../source/Domain/GeoJSON/GeometryCollection';
import { runner } from '../../helper/geometry';

runner(
	'Domain/GeoJSON/GeometryCollection',
	Export,
	'isGeometryCollection',
	'isStrictGeometryCollection',
);
