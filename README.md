# @konfirm/geojson

GeoJSON validation, iteration, intersection and distance calculation.

## API

### Types

All [GeoJSON types](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1) are available as export

| type               | descriptions                                                                                | note                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Position           | A [GeoJSON Position](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.1)           | `[Longitude, Latitude, Altitude?]`                                                                                                                                                                      |
| Point              | A [GeoJSON Point](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.2)              | The `coordinates` property is a `Position`                                                                                                                                                              |
| MultiPoint         | A [GeoJSON MultiPoint](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.3)         | The `coordinates` property is an array of `Position`                                                                                                                                                    |
| LineString         | A [GeoJSON LineString](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.4)         | The `coordinates` property is an array of two or more `Position`                                                                                                                                        |
| MultiLineString    | A [GeoJSON MultiLineString](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.5)    | The `coordinates` property is an array of`LineString` coordinates                                                                                                                                       |
| Polygon            | A [GeoJSON Polygon](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6)            | The `coordinates` property is an array of "LinearRings" (closed `LineString` coordinates, where the first and last `Positin` are identical)                                                             |
| MultiPolygon       | A [GeoJSON MultiPolygon](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.7)       | The `coordinates` property is an array of `Polygon` coordinate arrays                                                                                                                                   |
| GeometryCollection | A [GeoJSON GeometryCollection](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.8) | geometries is an array of Geometries (`Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`)                                                                                |
| Feature            | A [GeoJSON Feature](https://datatracker.ietf.org/doc/html/rfc7946#section-3.2)              | A spatially bounded 'Thing', consisting of a `geometry` property (`Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`, `GeometryCollection`) with additional `properties` |
| FeatureCollection  | A [GeoJSON Collection](https://datatracker.ietf.org/doc/html/rfc7946#section-3.3)           | The `features` property is an array of `Feature` objects                                                                                                                                                |


### Type Guards

Most of the exported functionality is based on validation of GeoJSON objects, validating required and optional (if provided) properties. 
The `isStrict*` variants of the type guards also validate the following:
 - `Longitude` is a number in the range (inclusive) `-180..180`
 - `Latitude` is a number in the range (inclusive) `-90..90`
 - `Altitude` is a number in the range (inclusive) `-6371008.7714..20180000` (Earth center(-ish) up to the GPS satelite distance)
 - `Polygon` "LinearRing" are closed (first and last `Position` are identical)
 - `Polygon` "LinearRing" have the correct winding (counterclockwise for exterior rings (outline), clockwise for interior rings (holes))


| type               | guard                  | strict guard                 | description                                                    |
| ------------------ | ---------------------- | ---------------------------- | -------------------------------------------------------------- |
| Position           | `isPosition`           | `isStrictPosition`           | validate whether the input is valid GeoJSON Position           |
| Point              | `isPoint`              | `isStrictPoint`              | validate whether the input is valid GeoJSON Point              |
| MultiPoint         | `isMultiPoint`         | `isStrictMultiPoint`         | validate whether the input is valid GeoJSON MultiPoint         |
| LineString         | `isLineString`         | `isStrictLineString`         | validate whether the input is valid GeoJSON LineString         |
| MultiLineString    | `isMultiLineString`    | `isStrictMultiLineString`    | validate whether the input is valid GeoJSON MultiLineString    |
| Polygon            | `isPolygon`            | `isStrictPolygon`            | validate whether the input is valid GeoJSON Polygon            |
| MultiPolygon       | `isMultiPolygon`       | `isStrictMultiPolygon`       | validate whether the input is valid GeoJSON MultiPolygon       |
| GeometryCollection | `isGeometryCollection` | `isStrictGeometryCollection` | validate whether the input is valid GeoJSON GeometryCollection |
| Feature            | `isFeature`            | `isStrictFeature`            | validate whether the input is valid GeoJSON Feature            |
| FeatureCollection  | `isFeatureCollection`  | `isStrictFeatureCollection`  | validate whether the input is valid GeoJSON FeatureCollection  |
| GeoJSON            | `isGeoJSON`            | `isStrictGeoJSON`            | validate the input to be valid GeoJSON                         |

```ts
import { isPoint, isStrictPoint } from '@konfirm/geojson';

const point: Point = {
    type: 'Point',
    coordinates: [181, 91],
};

console.log('the point is a GeoJSON Point', isPoint(point)); // true, as the structure is up to specification
console.log('the point is a strict GeoJSON Point', isStrictPoint(point)); // false, as the coordinates are not within the specified ranges
```

### intersect

Verify whether the provided GeoJSON objects intersect.

Usage: `intersect(<Geometry(Collection)|Feature(Collection)>, <Geometry(Collection)|Feature(Collection)>): boolean`

```ts
import { intersect, Point, Feature } from '@konfirm/geojson';

const point: Point = {
    type: 'Point',
    coordinates: [1, 1],
};
const feature: Feature = {
    type: 'Feature',
    properties: {
        name: 'triangle'
    },
    geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 2], [2, 1], [0, 0]]],
    },
}

console.log('point intersects feature', intersect(point, feature)); // true
console.log('feature intersects point', intersect(feature, point)); // true
```

### distance

Obtain the (shortest) distance in meters between two GeoJSON objects. There are three formulas which can be used:

 - `direct` (default), calculates the distance between coordinates using the Pythagorean equation, this is the fastest formula at the cost of (huge amount of) accuracy
 - `haversine`, calculates the distance between coordinates using the [haversine formula](https://en.wikipedia.org/wiki/Haversine_formula), improves the accuracy to a level which is probably suitable for most needs with a decent performance
 - `vincenty`, calculates the distance between coordinates using the [Vincenty's formula](https://en.wikipedia.org/wiki/Vincenty%27s_formulae), the most accurate but the least performant algorithm.

Usage: `distance(<Geometry(Collection)|Feature(Collection)>, <Geometry(Collection)|Feature(Collection)> [, <'direct'|'haversine'|'vincenty'>]): number`

```ts
import { distance, Feature } from '@konfirm/geojson';

    const a: Feature = {
        type: 'Feature',
        properties: {
            name: 'Schiphol Airpoirt, Amsterdam',
        },
        geometry: {
            type: 'Point',
            coordinates: [4.763889, 52.308333],
        },
    };
    const b: Feature = {
        type: 'Feature',
        properties: {
            name: 'John F. Kennedy International Airport, New York',
        },
        geometry: {
            type: 'Point',
            coordinates: [-73.778889, 40.639722],
        },
    };

    console.log(distance(a, b));             // 8829424.604594177
    console.log(distance(a, b, 'direct');    // 8829424.604594177 ('direct' is the default)
    console.log(distance(a, b, 'haversine'); // 5847546.425707642
    console.log(distance(a, b, 'vincenty');  // 5863355.371234315
```

### SimpleGeometryIterator

The SimpleGeometryIterator class is a convenience helper utility which yeilds all simple Geometric shapes (`Point`, `LineString`, `Polygon`) from any GeoJSON object. Using a SimpleGeometryIterator allows you to focus on just implementing logic for the simple Geometric shapes whilst supporting any compbination of GeoJSON objects as input.

| input type           | yields type(s)                     | description                                                                              |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `Point`              | `Point`                            | yields the `Point` geometry as is                                                        |
| `MultiPoint`         | `Point`                            | yields every `Point` of the `MultiPoint`                                                 |
| `LineString`         | `LineString`                       | yields the `LineString` geometry as is                                                   |
| `MultiLineString`    | `LineString`                       | yields every `LineString` of the `MultiLineString`                                       |
| `Polygon`            | `Polygon`                          | yields the `Polygon` geometry as is                                                      |
| `MultiPolygon`       | `Polygon`                          | yields every `Polygon` of the `MultiPolygon`                                             |
| `GeometryCollection` | `Point`, `LineString` or `Polygon` | yields every geometry contained within the collection (see the corresponing types above) |
| `Feature`            | `Point`, `LineString` or `Polygon` | yields the geometry of a feature (see the corresponding types above)                     |
| `FeatureCollection`  | `Point`, `LineString` or `Polygon` | yields every `Feature` (see `Feature`)                                                   |

```ts
import type { Point, MultiPoint, LineString, MultiLineString, GeometryCollection, Feature, FeatureCollection } from '@konfirm/geojson';
import { SimpleGeometryIterator } from '@konfirm/geojson';

const point: Point = {
    type: 'Point',
    coordinates: [5.903949737548828, 51.991936460056515],
};
const multipoint: MultiPoint = {
    type: 'MultiPoint',
    coordinates: [
        [5.896482467651367, 52.00039200820837],
        [5.888843536376953, 51.99912377779024],
    ],
};
const linestring: LineString = {
    type: 'LineString',
    coordinates: [
        [5.9077370166778564, 51.9944435645134],
        [5.90764045715332, 51.994209045542206],
        [5.907415151596069, 51.99408683094357],
    ],
};
const multilinestring: MultiLineString = {
    type: 'MultiLineString',
    coordinates: [
        [
            [5.905205011367797, 51.99430813821511],
            [5.905086994171143, 51.994261894995034],
            [5.905033349990845, 51.99414958983319],
            [5.9051138162612915, 51.994116558849626]
        ],
        [
            [5.904818773269653, 51.993825885143515],
            [5.905521512031555, 51.993551725259614],
            [5.905789732933044, 51.99358805979856],
        ],
    ],
};
const geometrycollection: GeometryCollection = {
    type: 'GeometryCollection',
    geometries: [point],
};
const featurecollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {},
            geometry: linestring,
        },
        {
            type: 'Feature',
            properties: {},
            geometry: multilinestring,
        },
    ]
};

const simplified = [...new SimpleGeometryIterator(multipoint, geometrycollection, featurecollection)];
/*
    [
        {
            type: 'Point',
            coordinates: ...multipoint[0]
        },
        {
            type: 'Point',
            coordinates: ...multipoint[1]
        },
        {
            type: 'Point',
            coordinates: ...point
        },
        {
            type: 'LineString',
            coordinates: ...linestring
        },
        {
            type: 'LineString',
            coordinates: ...multilinestring[0]
        },
        {
            type: 'LineString',
            coordinates: ...multilinestring[1]
        },
    ]
*/
```
