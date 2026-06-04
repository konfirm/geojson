[![Release](https://github.com/konfirm/geojson/actions/workflows/release.yml/badge.svg)](https://github.com/konfirm/geojson/actions/workflows/release.yml)
[![Tests](https://github.com/konfirm/geojson/actions/workflows/tests.yml/badge.svg)](https://github.com/konfirm/geojson/actions/workflows/tests.yml)

# @konfirm/geojson

TypeScript-first GeoJSON utilities built to [RFC 7946](https://www.rfc-editor.org/rfc/rfc7946). Strict type guards that actually enforce winding order (one of very few libraries that do), geodesic distance across four formulas from haversine to Karney, and intersection testing across all geometry types.

## Installation

```sh
npm install @konfirm/geojson
```

```ts
import { isStrictPolygon, distance, karney } from '@konfirm/geojson';
```

## Upgrading to v2?

Five breaking changes. Quick fixes below; the [full migration guide](./MIGRATION.md) has the details.

| Change | v1 | v2 | Quick fix |
|--------|----|----|-----------|
| `distance()` default | `'cartesian'` | `'haversine'` | Pass `'cartesian'` explicitly, or `import { cartesian as distance }` |
| `isStrictPolygon` winding | not enforced | RFC 7946 §3.1.6 (CCW exterior, CW interior) | Use `isPolygon` for loose validation |
| `vincenty` near-antipodal | silent wrong result | throws `EvalError` | Catch the error, or switch to `'karney'` |
| `Geometry` / `isGeometry` | excluded `GeometryCollection` | includes `GeometryCollection` | Use `isGeometryPrimitive` if you need the six coordinate-bearing types only |
| `Feature.geometry` type | `Geometry \| GeometryCollection` (null never typed) | `Geometry \| null` (matches runtime) | Add null checks where `geometry` was assumed non-null; `isFeature(v, isGeometry)` narrows to non-null |

On the winding: `isStrictPolygon` didn't check the one thing [RFC 7946](https://www.rfc-editor.org/rfc/rfc7946#section-3.1.6) says polygons MUST do — the winding. Counterclockwise for the outer ring, and clockwise for the inner rings (holes). To top it off, if it had checked, it would have been wrong anyway. Wrong formula, wrong data backing it up. That's on me — [read more on what happened, why I didn't notice, and what was done to prevent it](./docs/adr-winding-and-test-data.md).

**The most likely change you need to make** is the `distance()` default. If you had:

```ts
import { distance } from '@konfirm/geojson';
distance(pointA, polygonB);
```

you are getting a better answer now. Don't want that? Pick your fix:

```ts
// explicit at the call site
distance(pointA, polygonB, 'cartesian');

// or: import the formula directly — zero call-site changes
import { cartesian as distance } from '@konfirm/geojson';
distance(pointA, polygonB);
```

Either way, [ask yourself whether `cartesian` is actually what you want](./MIGRATION.md#1-distance-default-formula-changed-from-cartesian-to-haversine) — for real-world coordinates it can be off by more than 50%.

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
| Polygon            | A [GeoJSON Polygon](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6)            | The `coordinates` property is an array of "LinearRings" (closed `LineString` coordinates, where the first and last `Position` are identical)                                                            |
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
 - `Polygon` "LinearRing" have the correct winding per RFC 7946 §3.1.6: counterclockwise for exterior rings, clockwise for interior rings (holes)


| type               | guard                  | strict guard                 | description                                                                                                        |
| ------------------ | ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Position           | `isPosition`           | `isStrictPosition`           | validate whether the input is valid GeoJSON Position                                                               |
| Point              | `isPoint`              | `isStrictPoint`              | validate whether the input is valid GeoJSON Point                                                                  |
| MultiPoint         | `isMultiPoint`         | `isStrictMultiPoint`         | validate whether the input is valid GeoJSON MultiPoint                                                             |
| LineString         | `isLineString`         | `isStrictLineString`         | validate whether the input is valid GeoJSON LineString                                                             |
| MultiLineString    | `isMultiLineString`    | `isStrictMultiLineString`    | validate whether the input is valid GeoJSON MultiLineString                                                        |
| Polygon            | `isPolygon`            | `isStrictPolygon`            | validate whether the input is valid GeoJSON Polygon                                                                |
| MultiPolygon       | `isMultiPolygon`       | `isStrictMultiPolygon`       | validate whether the input is valid GeoJSON MultiPolygon                                                           |
| GeometryCollection | `isGeometryCollection` | `isStrictGeometryCollection` | validate whether the input is valid GeoJSON GeometryCollection                                                     |
| Geometry           | `isGeometry`           | `isStrictGeometry`           | validate whether the input is valid GeoJSON Geometry (`Point`, `LineString`, `Polygon` or their `Multi*` variants) |
| Feature            | `isFeature`            | `isStrictFeature`            | validate whether the input is valid GeoJSON Feature                                                                |
| FeatureCollection  | `isFeatureCollection`  | `isStrictFeatureCollection`  | validate whether the input is valid GeoJSON FeatureCollection                                                      |
| GeoJSON            | `isGeoJSON`            | `isStrictGeoJSON`            | validate the input to be valid GeoJSON                                                                             |

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

Obtain the (shortest) distance in meters between two GeoJSON objects. Choose a formula based on your use case:

 - `haversine` (**default**) — geographic lon/lat coordinates, most use cases; good accuracy, good performance
 - `vincenty` — when you need higher accuracy than haversine and can guarantee inputs are not near-antipodal — points on nearly opposite sides of the Earth — (throws for those)
 - `karney` — when correctness is unconditional: near-antipodal inputs, or when you simply cannot afford a wrong answer; ~15 nm accuracy on WGS84
 - `cartesian` — when coordinates are in a metric projected system (e.g. RD New / EPSG:28992, UTM) where Euclidean distance is correct; note that projected coordinates are not valid strict GeoJSON (RFC 7946 requires geographic lon/lat, WGS84) — **do not use for geographic coordinates**

Each formula is also exported as a standalone function for direct use and better tree-shaking:

Usage: `distance(<GeoJSON>, <GeoJSON> [, <'haversine'|'vincenty'|'karney'|'cartesian'>]): number`

```ts
import { distance, karney, Feature } from '@konfirm/geojson';

const a: Feature = {
    type: 'Feature',
    properties: { name: 'Schiphol Airport, Amsterdam' },
    geometry: { type: 'Point', coordinates: [4.763889, 52.308333] },
};
const b: Feature = {
    type: 'Feature',
    properties: { name: 'John F. Kennedy International Airport, New York' },
    geometry: { type: 'Point', coordinates: [-73.778889, 40.639722] },
};

console.log(distance(a, b));              // 5847546.425707642 ('haversine' is the default)
console.log(distance(a, b, 'haversine')); // 5847546.425707642
console.log(distance(a, b, 'vincenty'));  // 5863355.371234315
console.log(distance(a, b, 'karney'));    // 5863355.371221913
console.log(distance(a, b, 'cartesian')); // 8829424.604594177

console.log(karney(a, b)); // 5863446.282438116 — same as distance(a, b, 'karney')
```

### SimpleGeometryIterator

The SimpleGeometryIterator class is a convenience helper utility which yields all simple Geometric shapes (`Point`, `LineString`, `Polygon`) from any GeoJSON object. Using a SimpleGeometryIterator allows you to focus on just implementing logic for the simple Geometric shapes whilst supporting any combination of GeoJSON objects as input.

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

## License

MIT License Copyright (c) 2021-2026 Rogier Spieker (Konfirm)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
