import * as Export from '../../../source/Domain/GeoJSON/FeatureCollection';
import { runner } from '../../helper/geometry';

runner(
	'Domain/GeoJSON/FeatureCollection',
	Export,
	'isFeatureCollection',
	'isStrictFeatureCollection',
);
