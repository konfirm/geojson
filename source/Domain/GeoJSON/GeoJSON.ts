import { any } from "@konfirm/guard";
import { Feature, isFeature, isStrictFeature } from "./Feature";
import { FeatureCollection, isFeatureCollection, isStrictFeatureCollection } from "./FeatureCollection";
import { GeometryCollection, isGeometryCollection, isStrictGeometryCollection } from "./GeometryCollection";
import { Geometry, isGeometry, isStrictGeometry } from "./Geometry";

export type GeoJSON = Geometry | GeometryCollection | Feature | FeatureCollection;
export const isGeoJSON = any<GeoJSON>(isGeometry, isGeometryCollection, isFeature, isFeatureCollection);
export const isStrictGeoJSON = any<GeoJSON>(isStrictGeometry, isStrictGeometryCollection, isStrictFeature, isStrictFeatureCollection);
