// intersect and distance functions
export { intersect } from './Domain/Utility/Intersect';
export { distance } from './Domain/Utility/Distance';

// SimpleGeometryIterator
export { SimpleGeometryIterator } from './Domain/Iterator/SimpleGeometry';

// the individual GeoJSON types and type guards
export { Position, isPosition, isStrictPosition } from './Domain/GeoJSON/Concept/Position';
export { Point, isPoint, isStrictPoint } from './Domain/GeoJSON/Geometry/Point';
export { MultiPoint, isMultiPoint, isStrictMultiPoint } from './Domain/GeoJSON/Geometry/MultiPoint';
export { LineString, isLineString, isStrictLineString } from './Domain/GeoJSON/Geometry/LineString';
export { MultiLineString, isMultiLineString, isStrictMultiLineString } from './Domain/GeoJSON/Geometry/MultiLineString';
export { Polygon, isPolygon, isStrictPolygon } from './Domain/GeoJSON/Geometry/Polygon';
export { MultiPolygon, isMultiPolygon, isStrictMultiPolygon } from './Domain/GeoJSON/Geometry/MultiPolygon';
export { GeometryCollection, isGeometryCollection, isStrictGeometryCollection } from './Domain/GeoJSON/GeometryCollection';
export { Feature, isFeature, isStrictFeature } from './Domain/GeoJSON/Feature';
export { FeatureCollection, isFeatureCollection, isStrictFeatureCollection } from './Domain/GeoJSON/FeatureCollection';
export { GeoJSON, isGeoJSON, isStrictGeoJSON } from './Domain/GeoJSON/GeoJSON';
