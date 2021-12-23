import test from 'tape';
import * as Export from '../../../../source/Domain/GeoJSON/Geometry/MultiPoint';
import { runner } from '../../../helper/geometry';

runner(
	test,
	'Domain/GeoJSON/Geometry/MultiPoint',
	Export,
	['isMultiPointCoordinates', ['LineString']],
	'isMultiPoint',
	['isStrictMultiPointCoordinates', ['LineString']],
	'isStrictMultiPoint',
);
