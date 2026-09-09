[![Release](https://github.com/konfirm/geojson/actions/workflows/release.yml/badge.svg)](https://github.com/konfirm/geojson/actions/workflows/release.yml)
[![Tests](https://github.com/konfirm/geojson/actions/workflows/tests.yml/badge.svg)](https://github.com/konfirm/geojson/actions/workflows/tests.yml)

# @konfirm/geojson

GeoJSON is a standard format for encoding geographic data structures — points, lines, polygons — as JSON. It was formalized in [RFC 7946](https://www.rfc-editor.org/rfc/rfc7946) in 2016, which introduced requirements (like winding order for polygon rings) that many tools still don't enforce.
> This TypeScript-first library gives you strict RFC 7946 validation and relaxed structural checks — so you can choose the right level of correctness for your data — along with geodesic distance across four formulas, intersection testing, and geometry iteration.

## Installation and usage

```sh
npm install @konfirm/geojson
```

```ts
import { isGeoJSON, isStrictGeoJSON, distance, karney } from '@konfirm/geojson';
```

## What @konfirm/geojson offers

**Types.** All RFC 7946 GeoJSON types (`Point`, `LineString`, `Polygon`, their `Multi*` variants, `GeometryCollection`, `Feature`, `FeatureCollection`) are exported as TypeScript types. `Feature<G>`, `FeatureCollection<G>`, and `GeometryCollection<G>` are generic so you can narrow the geometry type at compile time.

**Validation.** Every type has two guards: `is*` checks structure (is this a valid GeoJSON object at all?), and `isStrict*` also checks coordinate ranges and RFC 7946 (§3.1.6) winding order. You pick the tier; you can use both in the same codebase.

```ts
import { isGeoJSON, isStrictGeoJSON } from '@konfirm/geojson';

isGeoJSON(value)       // structural check — coordinates in bounds? irrelevant.
isStrictGeoJSON(value) // also checks ranges and CCW/CW winding per RFC 7946
```

**Distance.** Geodesic distance between any two GeoJSON objects (not just points) across four formulas. `haversine` covers most use cases. `karney` always converges.

**Intersection.** Boolean intersection test across all geometry type combinations (`Point`, `LineString`, `Polygon` and their `Multi*` and `Feature`/`FeatureCollection` wrappers).

**Iteration.** `SimpleGeometryIterator` flattens any GeoJSON — including nested `GeometryCollection` and `FeatureCollection` — into a sequence of simple `Point`, `LineString`, and `Polygon` geometries.

## Upgrading to v2?

**What's new:**
- `karney` — fourth distance formula; always converges, ~15 nm accuracy on WGS84, including near-antipodal inputs
- Generic `Feature<G>`, `FeatureCollection<G>`, `GeometryCollection<G>` — narrow the geometry type at compile time by passing a guard: `isFeature(value, isPoint)` → `value is Feature<Point>`
- Named formula exports — `cartesian`, `haversine`, `vincenty`, `karney` as standalone `(GeoJSON, GeoJSON) => number` functions for direct use and tree-shaking
- RFC 7946 winding enforcement in `isStrictPolygon` and `isStrictMultiPolygon` — was silently skipped in v1

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

## Why this over...?

The one thing most GeoJSON validators skip is winding order. [RFC 7946 §3.1.6](https://www.rfc-editor.org/rfc/rfc7946#section-3.1.6) says polygon exterior rings **must** be counterclockwise and interior rings (holes) clockwise — but virtually no public library enforces this. `isStrictPolygon` is one of the very few that does.

This has a concrete consequence: [Natural Earth](https://www.naturalearthdata.com/), the de-facto standard country dataset, [uses the opposite convention](https://github.com/nvkelso/natural-earth-vector/issues/885) and fails strict validation. That is a feature, not a bug — `isPolygon` accepts it, `isStrictPolygon` rejects it. The split lets you choose strictness without switching libraries.

| | this | @types/geojson | geojson-validation | @mapbox/geojsonhint | @mapbox/geojson-rewind | @turf/turf |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| TypeScript types | ✓ | ✓ | — | — | — | ✓ |
| Structural (loose) validation | ✓ | — | ✓ | ✓ | — | — |
| Strict validation (ranges + winding) | ✓ | — | — | — | — | — |
| Validation failure reasons | — | — | ✓ | ✓ | — | — |
| RFC 7946 winding enforcement | ✓ | — | — | — | — | — |
| Winding correction | — | — | — | — | ✓¹ | — |
| Intersection testing | ✓ | — | — | — | — | ✓ |
| Haversine distance | ✓ | — | — | — | — | ✓ |
| Vincenty distance | ✓ | — | — | — | — | — |
| Karney distance (always converges, ~15 nm) | ✓ | — | — | — | — | — |
| Spatial ops (buffer, union, simplify, …) | — | — | — | — | — | ✓ |
| CLI | — | — | ✓ | ✓ | ✓ | — |
| Zero runtime dependencies | ✓ | ✓ | ✓ | — | — | — |
| Active maintenance | ✓ | ✓ | — | ✓ | ✓ | ✓ |

¹ `@mapbox/geojson-rewind` defaults to clockwise exterior — the pre-RFC 7946 convention. To match RFC 7946 you must pass `rewind(geojson, false)` explicitly.

**When you should use something else instead:**

- Need spatial operations — buffer, union, difference, simplify, Voronoi, clustering? Use [Turf](https://turfjs.org/). It is a far broader library and this package does not compete with it.
- Need to know *why* a value failed — which ring, which coordinate, which rule? [`geojson-validation`](https://www.npmjs.com/package/geojson-validation) and [`@mapbox/geojsonhint`](https://www.npmjs.com/package/@mapbox/geojsonhint) return error strings; this package returns `boolean`.
- Need a CLI to lint GeoJSON files? Neither does this package; `geojsonhint` is the right tool for that.

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
| GeometryCollection | A [GeoJSON GeometryCollection](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.8) | `geometries` is an array of Geometries (`Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`). Generic: `GeometryCollection<G extends Geometry>`                          |
| Feature            | A [GeoJSON Feature](https://datatracker.ietf.org/doc/html/rfc7946#section-3.2)              | A spatially bounded thing with a `geometry` (`Geometry \| null`) and `properties`. Generic: `Feature<G extends Geometry \| null>`                                                                      |
| FeatureCollection  | A [GeoJSON Collection](https://datatracker.ietf.org/doc/html/rfc7946#section-3.3)           | The `features` property is an array of `Feature` objects. Generic: `FeatureCollection<G extends Geometry \| null>`                                                                                     |
| Geometry           | — (union type)                                                                               | Union of all geometry types including `GeometryCollection`. Use `GeometryPrimitive` when you need only the six coordinate-bearing types.                                                                |
| GeometryPrimitive  | — (union type)                                                                               | The six coordinate-bearing geometry types: `Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`. Excludes `GeometryCollection`.                                            |


### Type Guards

Most of the exported functionality is based on validation of GeoJSON objects, validating required and optional (if provided) properties.
The `isStrict*` variants of the type guards also validate the following:
 - `Longitude` is a number in the range (inclusive) `-180..180`
 - `Latitude` is a number in the range (inclusive) `-90..90`
 - `Altitude` is a number in the range (inclusive) `-6371008.7714..20180000` (Earth center(-ish) up to the GPS satelite distance)
 - `Polygon` "LinearRing" are closed (first and last `Position` are identical)
 - `Polygon` "LinearRing" have the correct winding per RFC 7946 (§3.1.6): counterclockwise for exterior rings, clockwise for interior rings (holes)


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
| Geometry           | `isGeometry`           | `isStrictGeometry`           | validate whether the input is any valid GeoJSON Geometry, including `GeometryCollection`                           |
| GeometryPrimitive  | `isGeometryPrimitive`  | `isStrictGeometryPrimitive`  | validate whether the input is one of the six coordinate-bearing geometry types (excludes `GeometryCollection`)     |
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

#### Generics and narrowing

`Feature<G>`, `FeatureCollection<G>`, and `GeometryCollection<G>` are generic. The corresponding guards accept an optional second argument — a geometry guard — to narrow the inferred type:

```ts
import { isFeature, isFeatureCollection, isGeometryCollection, isPoint, isStrictPoint } from '@konfirm/geojson';

// Without a guard: value is Feature<Geometry | null>
isFeature(value);

// With a guard: value is Feature<Point>
isFeature(value, isPoint);

// Works with strict guards and custom guards too
isFeature(value, isStrictPoint);                     // value is Feature<Point> (strict coordinates)
isFeatureCollection(value, isPoint);                 // value is FeatureCollection<Point>
isGeometryCollection(value, isPoint);                // value is GeometryCollection<Point>

// The strict variants of the three guards accept the same optional narrowing argument
isStrictFeature(value, isStrictPoint);               // value is Feature<Point>
isStrictFeatureCollection(value, isStrictPoint);     // value is FeatureCollection<Point>
isStrictGeometryCollection(value, isStrictPoint);    // value is GeometryCollection<Point>
```

### Antimeridian-crossing geometry

`intersect`, `distance`, and the RFC 7946 §3.1.6 winding checks (`isStrictPolygon`,
`isStrictMultiPolygon`) all correctly handle geometry that crosses the antimeridian (±180°
longitude) without being split into a `MultiPolygon`/`MultiLineString` — RFC 7946 §3.1.9 permits
this ("SHOULD be represented by cutting" is not a MUST). [Read how the fix works](./docs/antimeridian.md).

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

Each formula is also exported as a standalone function for direct use and better tree-shaking.

`cartesian` and `haversine` both compute `radius × angular_separation` internally, and take that radius as an optional second-to-last argument, defaulting to this library's mean Earth radius (6,371,008.7714 m). This is for callers matching a specific sphere model rather than modelling Earth generically:

```ts
haversine(a, b, 6_378_100);     // MongoDB's own $nearSphere/2dsphere sphere radius (not WGS84)
haversine(a, b, 1);             // raw angular separation in radians (unit sphere)
cartesian(a, b, 180 / Math.PI); // cancels the internal degrees→radians step: raw planar Euclidean distance
```

`distance()` does not take a radius argument — use `cartesian`/`haversine` directly when you need one.

The formula argument accepts either a string or a custom `(a: Position, b: Position) => number` function — useful when you need a projection-specific calculation or want to plug in your own formula. The `PointToPointCalculation` type covers both and is exported for use in typed wrapper functions.

Usage: `distance(<GeoJSON>, <GeoJSON> [, <PointToPointCalculation>]): number`

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

console.log(karney(a, b)); // 5863355.371221913 — same as distance(a, b, 'karney')
```

#### Accuracy versus performance

This library's karney implementation matches Karney's own GeographicLib C++ reference within 1 nm on average and 11 nm at worst, across 500,000 test cases — close enough to use as the accuracy benchmark below.
A result is counted as **wrong** when it deviates from the benchmark by more than 10.0 m. Throws count as wrong too.

Performance: karney shows absolute µs/call on this machine; other formulas show speed relative to karney (~Nx = N times faster) — ratios are more portable across machines than absolute times.

| band | n | karney | vincenty | haversine | cartesian |
| --- | ---: | --- | --- | --- | --- |
| <1 m | 45 | none · 13.2 µs | none · ~23x | none · ~53x | **4.4% · ~86x** |
| <10 m | 375 | none · 1.87 µs | none · ~4x | none · ~12x | 14.4% · ~20x |
| <100 m | 3,980 | none · 1.84 µs | none · ~4x | none · ~12x | 42.9% · ~20x |
| <1 km | 40,523 | none · 2.00 µs | none · ~4x | none · ~13x | 73.0% · ~21x |
| <10 km | 5,125 | none · 2.18 µs | none · ~4x | **0.3% · ~14x** | 81.3% · ~22x |
| <25 km | 78 | none · 2.41 µs | none · ~4x | 96.2% · ~12x | 96.2% · ~20x |
| <50 km | 108 | none · 2.68 µs | none · ~4x | 97.2% · ~14x | 98.1% · ~23x |
| <100 km | 239 | none · 2.20 µs | none · ~4x | 99.6% · ~13x | 99.6% · ~24x |
| <1 000 km | 5,371 | none · 2.32 µs | none · ~4x | 99.9% · ~14x | 99.9% · ~25x |
| <10 000 km | 119,455 | none · 2.90 µs | none · ~4x | 100.0% · ~14x | 100.0% · ~30x |
| <15 000 km | 77,875 | none · 3.06 µs | **none · ~4x** | 100.0% · ~16x | 100.0% · ~31x |
| >15 000 km | 146,826 | none · 2.68 µs | 19.8% · ~4x | 100.0% · ~14x | 100.0% · ~27x |
| near-antipodal | 100,000 | none · 3.25 µs | 34.9% · ~1x | 99.9% · ~18x | 100.0% · ~31x |

Run your own numbers: `npm run compare:formulas -- --threshold <metres>` (current: 10 m)

### SimpleGeometryIterator

The SimpleGeometryIterator class is a helper utility that flattens any GeoJSON input — including nested `FeatureCollection` and `GeometryCollection` — into a flat sequence of simple geometries (`Point`, `LineString`, `Polygon`). Multi-geometry types are split into their individual components. The original structure is never modified and no intermediate arrays are built.

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

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get started. To report a vulnerability, see [SECURITY.md](./SECURITY.md).

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
