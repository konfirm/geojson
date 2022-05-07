import test from 'tape';
import * as Export from '../../../source/Domain/Iterator/IterablePair';
import { SimpleGeometryIterator } from '../../../source/Domain/Iterator/SimpleGeometry';
import { Point } from '../../../source/Domain/GeoJSON/Geometry/Point';
import { MultiPoint } from '../../../source/Domain/GeoJSON/Geometry/MultiPoint';
import { LineString } from '../../../source/Domain/GeoJSON/Geometry/LineString';
import { MultiLineString } from '../../../source/Domain/GeoJSON/Geometry/MultiLineString';
import { Polygon } from '../../../source/Domain/GeoJSON/Geometry/Polygon';
import { MultiPolygon } from '../../../source/Domain/GeoJSON/Geometry/MultiPolygon';
import { GeometryCollection } from '../../../source/Domain/GeoJSON/GeometryCollection';
import { Feature } from '../../../source/Domain/GeoJSON/Feature';
import { FeatureCollection } from '../../../source/Domain/GeoJSON/FeatureCollection';
import { explain, exported } from '../../helper/geometry';

const point: Point = { type: 'Point', coordinates: [0, 0] };
const multipoint: MultiPoint = { type: 'MultiPoint', coordinates: [[1, 1], [2, 2]] };
const linestring: LineString = { type: 'LineString', coordinates: [[3, 3], [4, 4]] };
const multilinestring: MultiLineString = { type: 'MultiLineString', coordinates: [[[5, 5], [6, 6]], [[7, 7], [8, 8]], [[9, 9], [10, 10]]] };
const polygon: Polygon = { type: 'Polygon', coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]] };
const multipolygon: MultiPolygon = { type: 'MultiPolygon', coordinates: [[[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]], [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]]] };
const geometrycollection: GeometryCollection = { type: 'GeometryCollection', geometries: [point, multipoint] };
const feature: Feature = { type: 'Feature', properties: null, geometry: linestring };
const featurecollection: FeatureCollection = {
    type: 'FeatureCollection', features: [
        { type: 'Feature', properties: null, geometry: multilinestring },
        { type: 'Feature', properties: null, geometry: polygon },
        { type: 'Feature', properties: null, geometry: multipolygon },
    ]
};

exported('Domain/Iterator/IterablePair', Export, 'IterablePairIterator');

const { IterablePairIterator } = Export;

test('Domain/Iterator/IterablePair - implements Symbol.iterator', (t) => {
    const iterator = new IterablePairIterator(new SimpleGeometryIterator(point), new SimpleGeometryIterator(multipoint));

    t.ok(Symbol.iterator in iterator, 'SimpleGeometryIterator implements Symbol.iterator');

    t.end();
});

test('Domain/Iterator/IterablePair - Point with MultiPoint', (t) => {
    const iterator = new IterablePairIterator(new SimpleGeometryIterator(point), new SimpleGeometryIterator(multipoint));
    const expanded = [...iterator];
    const expected = [
        [point, { type: 'Point', coordinates: [1, 1] }],
        [point, { type: 'Point', coordinates: [2, 2] }],
    ];

    t.equal(expanded.length, expected.length, `has ${expected.length} combinations`);

    let index = 0;
    for (const combo of iterator) {
        const expect = expected[index++];

        t.deepEqual(combo, expect, `combination is ${explain(expect[0])} with ${explain(expect[1])}`);
    }

    t.end();
});

test('Domain/Iterator/IterablePair - MultiPoint with LineString', (t) => {
    const iterator = new IterablePairIterator(new SimpleGeometryIterator(multipoint), new SimpleGeometryIterator(linestring));
    const expanded = [...iterator];
    const expected = [
        [{ type: 'Point', coordinates: [1, 1] }, linestring],
        [{ type: 'Point', coordinates: [2, 2] }, linestring],
    ];

    t.equal(expanded.length, expected.length, `has ${expected.length} combinations`);

    let index = 0;
    for (const combo of iterator) {
        const expect = expected[index++];

        t.deepEqual(combo, expect, `combination is ${explain(expect[0])} with ${explain(expect[1])}`);
    }

    t.end();
});

test('Domain/Iterator/IterablePair - MultiPoint with MultiLineString', (t) => {
    const iterator = new IterablePairIterator(new SimpleGeometryIterator(multipoint), new SimpleGeometryIterator(multilinestring));
    const expanded = [...iterator];
    const expected = [
        [{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[5, 5], [6, 6]] }],
        [{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[7, 7], [8, 8]] }],
        [{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[9, 9], [10, 10]] }],
        [{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[5, 5], [6, 6]] }],
        [{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[7, 7], [8, 8]] }],
        [{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[9, 9], [10, 10]] }],
    ];

    t.equal(expanded.length, expected.length, `has ${expected.length} combinations`);

    let index = 0;
    for (const combo of iterator) {
        const expect = expected[index++];

        t.deepEqual(combo, expect, `combination is ${explain(expect[0])} with ${explain(expect[1])}`);
    }

    t.end();
});

test('Domain/Iterator/IterablePair - MultiLineString with Polygon', (t) => {
    const iterator = new IterablePairIterator(new SimpleGeometryIterator(multilinestring), new SimpleGeometryIterator(polygon));
    const expanded = [...iterator];
    const expected = [
        [{ type: 'LineString', coordinates: [[5, 5], [6, 6]] }, polygon],
        [{ type: 'LineString', coordinates: [[7, 7], [8, 8]] }, polygon],
        [{ type: 'LineString', coordinates: [[9, 9], [10, 10]] }, polygon],
    ];

    t.equal(expanded.length, expected.length, `has ${expected.length} combinations`);

    let index = 0;
    for (const combo of iterator) {
        const expect = expected[index++];

        t.deepEqual(combo, expect, `combination is ${explain(expect[0])} with ${explain(expect[1])}`);
    }

    t.end();
});

test('Domain/Iterator/IterablePair - Polygon with MultiPolygon', (t) => {
    const iterator = new IterablePairIterator(new SimpleGeometryIterator(polygon), new SimpleGeometryIterator(multipolygon));
    const expanded = [...iterator];
    const expected = [
        [polygon, { type: 'Polygon', coordinates: [[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]] }],
        [polygon, { type: 'Polygon', coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]] }],
    ];

    t.equal(expanded.length, expected.length, `has ${expected.length} combinations`);

    let index = 0;
    for (const combo of iterator) {
        const expect = expected[index++];

        t.deepEqual(combo, expect, `combination is ${explain(expect[0])} with ${explain(expect[1])}`);
    }

    t.end();
});

test('Domain/Iterator/IterablePair - Polygon with Feature', (t) => {
    const iterator = new IterablePairIterator(new SimpleGeometryIterator(polygon), new SimpleGeometryIterator(feature));
    const expanded = [...iterator];
    const expected = [
        [polygon, linestring],
    ];

    t.equal(expanded.length, expected.length, `has ${expected.length} combinations`);

    let index = 0;
    for (const combo of iterator) {
        const expect = expected[index++];

        t.deepEqual(combo, expect, `combination is ${explain(expect[0])} with ${explain(expect[1])}`);
    }

    t.end();
});

test('Domain/Iterator/IterablePair - GeometryCollection with FeatureCollection', (t) => {
    const iterator = new IterablePairIterator(new SimpleGeometryIterator(geometrycollection), new SimpleGeometryIterator(featurecollection));
    const expanded = [...iterator];
    const expected = [
        [point, { type: 'LineString', coordinates: [[5, 5], [6, 6]] }],
        [point, { type: 'LineString', coordinates: [[7, 7], [8, 8]] }],
        [point, { type: 'LineString', coordinates: [[9, 9], [10, 10]] }],
        [point, polygon],
        [point, { type: 'Polygon', coordinates: [[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]] }],
        [point, { type: 'Polygon', coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]] }],

        [{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[5, 5], [6, 6]] }],
        [{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[7, 7], [8, 8]] }],
        [{ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[9, 9], [10, 10]] }],
        [{ type: 'Point', coordinates: [1, 1] }, polygon],
        [{ type: 'Point', coordinates: [1, 1] }, { type: 'Polygon', coordinates: [[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]] }],
        [{ type: 'Point', coordinates: [1, 1] }, { type: 'Polygon', coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]] }],

        [{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[5, 5], [6, 6]] }],
        [{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[7, 7], [8, 8]] }],
        [{ type: 'Point', coordinates: [2, 2] }, { type: 'LineString', coordinates: [[9, 9], [10, 10]] }],
        [{ type: 'Point', coordinates: [2, 2] }, polygon],
        [{ type: 'Point', coordinates: [2, 2] }, { type: 'Polygon', coordinates: [[[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]] }],
        [{ type: 'Point', coordinates: [2, 2] }, { type: 'Polygon', coordinates: [[[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]] }],
    ];

    t.equal(expanded.length, expected.length, `has ${expected.length} combinations`);

    let index = 0;
    for (const combo of iterator) {
        const expect = expected[index++];

        t.deepEqual(combo, expect, `combination is ${explain(expect[0])} with ${explain(expect[1])}`);
    }

    t.end();
});
