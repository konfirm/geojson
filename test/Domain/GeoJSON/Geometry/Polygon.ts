import * as Export from '../../../../source/Domain/GeoJSON/Geometry/Polygon';
import { runner } from '../../../helper/geometry';

runner(
	'Domain/GeoJSON/Geometry/Polygon',
	Export,
	'isPolygonCoordinates',
	'isPolygon',
	'isStrictPolygonCoordinates',
	'isStrictPolygon',
);
