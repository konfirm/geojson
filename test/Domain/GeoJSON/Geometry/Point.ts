import * as Export from '../../../../source/Domain/GeoJSON/Geometry/Point';
import { runner } from '../../../helper/geometry';

runner(
	'Domain/GeoJSON/Geometry/Point',
	Export,
	'isPointCoordinates',
	'isPoint',
	'isStrictPointCoordinates',
	'isStrictPoint',
);
