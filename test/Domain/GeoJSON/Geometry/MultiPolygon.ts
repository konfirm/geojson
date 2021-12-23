import test from 'tape';
import * as Export from '../../../../source/Domain/GeoJSON/Geometry/MultiPolygon';
import { runner } from '../../../helper/geometry';

runner(
	test,
	'Domain/GeoJSON/Geometry/MultiPolygon',
	Export,
	'isMultiPolygonCoordinates',
	'isMultiPolygon',
	'isStrictMultiPolygonCoordinates',
	'isStrictMultiPolygon',
);
