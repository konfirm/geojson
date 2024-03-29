import * as Export from '../../../../source/Domain/GeoJSON/Geometry/LineString';
import { runner } from '../../../helper/geometry';

runner(
	'Domain/GeoJSON/Geometry/LineString',
	Export,
	['isLineStringCoordinates', ['MultiPoint']],
	'isLineString',
	['isStrictLineStringCoordinates', ['MultiPoint']],
	'isStrictLineString',
);
