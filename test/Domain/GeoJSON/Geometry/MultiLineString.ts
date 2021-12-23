import test from 'tape';
import * as Export from '../../../../source/Domain/GeoJSON/Geometry/MultiLineString';
import { runner } from '../../../helper/geometry';

runner(
	test,
	'Domain/GeoJSON/Geometry/MultiLineString',
	Export,
	['isMultiLineStringCoordinates', ['Polygon']],
	'isMultiLineString',
	['isStrictMultiLineStringCoordinates', ['Polygon']],
	'isStrictMultiLineString',
);
