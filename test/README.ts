import test from 'tape';
import { distance, Feature, intersect, Point } from '../source/main';

test('README - intersect', (t) => {
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
            coordinates: [[[0, 0], [2, 1], [0, 2], [0, 2]]],
        },
    }

    t.true(intersect(point, feature), 'point intersects feature');
    t.true(intersect(feature, point), 'feature intersects point');

    t.end();
});

test('README - distance', (t) => {
    const a: Feature = {
        type: 'Feature',
        properties: {
            name: 'Amsterdam Airport Schiphol',
        },
        geometry: {
            type: 'Point',
            coordinates: [4.763889, 52.308333],
        },
    };
    const b: Feature = {
        type: 'Feature',
        properties: {
            name: 'New York John F. Kennedy International Airport'
        },
        geometry: {
            type: 'Point',
            coordinates: [-73.778889, 40.639722],
        },
    };

    t.equal(distance(a, b), 8829424.604594177, 'distance from a to b using default formula is 8829424.604594177');
    t.equal(distance(a, b, 'direct'), 8829424.604594177, 'distance from a to b using direct formula is 8829424.604594177');
    t.equal(distance(a, b, 'haversine'), 5847546.425707642, 'distance from a to b using haversine formula is 5847546.425707642');
    t.equal(distance(a, b, 'vincenty'), 5863355.371234315, 'distance from a to b using vincenty formula is 5863355.371234315');

    t.end();
});
