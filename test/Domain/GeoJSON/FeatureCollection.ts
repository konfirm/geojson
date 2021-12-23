import test from 'tape';
import * as Export from '../../../source/Domain/GeoJSON/FeatureCollection';
import { runner } from '../../helper/geometry';

runner(
	test,
	'Domain/GeoJSON/FeatureCollection',
	Export,
	'isFeatureCollection',
	'isStrictFeatureCollection',
);
