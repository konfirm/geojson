// intersect and distance functions

// the individual GeoJSON types and type guards
export {
	isPosition,
	isStrictPosition,
	Position,
} from './Domain/GeoJSON/Concept/Position';
export { Feature, isFeature, isStrictFeature } from './Domain/GeoJSON/Feature';
export {
	FeatureCollection,
	isFeatureCollection,
	isStrictFeatureCollection,
} from './Domain/GeoJSON/FeatureCollection';
export { GeoJSON, isGeoJSON, isStrictGeoJSON } from './Domain/GeoJSON/GeoJSON';
export {
	Geometry,
	isGeometry,
	isStrictGeometry,
} from './Domain/GeoJSON/Geometry';
export {
	isLineString,
	isStrictLineString,
	LineString,
} from './Domain/GeoJSON/Geometry/LineString';
export {
	isMultiLineString,
	isStrictMultiLineString,
	MultiLineString,
} from './Domain/GeoJSON/Geometry/MultiLineString';
export {
	isMultiPoint,
	isStrictMultiPoint,
	MultiPoint,
} from './Domain/GeoJSON/Geometry/MultiPoint';
export {
	isMultiPolygon,
	isStrictMultiPolygon,
	MultiPolygon,
} from './Domain/GeoJSON/Geometry/MultiPolygon';
export { isPoint, isStrictPoint, Point } from './Domain/GeoJSON/Geometry/Point';
export {
	isPolygon,
	isStrictPolygon,
	Polygon,
} from './Domain/GeoJSON/Geometry/Polygon';
export {
	GeometryCollection,
	isGeometryCollection,
	isStrictGeometryCollection,
} from './Domain/GeoJSON/GeometryCollection';
// SimpleGeometryIterator
export { SimpleGeometryIterator } from './Domain/Iterator/SimpleGeometry';
export { distance } from './Domain/Utility/Distance';
export { intersect } from './Domain/Utility/Intersect';
