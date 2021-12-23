import test from 'tape';
import * as Export from '../../../source/Domain/GeoJSON/Feature';
import { runner } from '../../helper/geometry';

runner(
	test,
	'Domain/GeoJSON/Feature',
	Export,
	'isFeature',
	'isStrictFeature',
);
