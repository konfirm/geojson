import * as Export from '../../../../source/Domain/GeoJSON/Geometry/MultiPolygon';
import { runner } from '../../../helper/geometry';

runner(
	'Domain/GeoJSON/Geometry/MultiPolygon',
	Export,
	'isMultiPolygonCoordinates',
	'isMultiPolygon',
	'isStrictMultiPolygonCoordinates',
	'isStrictMultiPolygon',
);
