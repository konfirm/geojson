import * as Export from '../../../source/Domain/GeoJSON/Feature';
import { runner } from '../../helper/geometry';

runner(
	'Domain/GeoJSON/Feature',
	Export,
	'isFeature',
	'isStrictFeature',
);
