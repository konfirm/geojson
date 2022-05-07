import { any } from "@konfirm/guard";
import { Feature, isFeature, isStrictFeature } from "./Feature";
import { FeatureCollection, isFeatureCollection, isStrictFeatureCollection } from "./FeatureCollection";
import { Geometries, isGeometries, isStrictGeometries } from "./Geometries";
import { GeometryCollection, isGeometryCollection, isStrictGeometryCollection } from "./GeometryCollection";

export type GeoJSON = Geometries | GeometryCollection | Feature | FeatureCollection;
export const isGeoJSON = any<GeoJSON>(isGeometries, isGeometryCollection, isFeature, isFeatureCollection);
export const isStrictGeoJSON = any<GeoJSON>(isStrictGeometries, isStrictGeometryCollection, isStrictFeature, isStrictFeatureCollection);
