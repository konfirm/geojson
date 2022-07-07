import * as Italy from './Italy';
import * as HolySee from './HolySee';
import * as SanMarino from './SanMarino';
import { Feature, FeatureCollection, GeoJSON, GeometryCollection, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from '../../source/main';
import { Geometries } from '../../source/Domain/GeoJSON/Geometries';

const relative = {
    outside1: [
        [12.444055080413818, 41.90334706377874],
        [12.447037696838379, 41.904784379636986],
        [12.449805736541746, 41.90735549729274],
        [12.45450496673584, 41.9085372185006]
    ],
    outside2: [
        [12.456951141357422, 41.910597193707545],
        [12.456693649291992, 41.90660493327494],
        [12.45896816253662, 41.906509115956666],
        [12.458603382110596, 41.903139448813754]
    ],
    partial: [
        [12.457487583160399, 41.90226107033812],
        [12.458195686340332, 41.90229301158531],
        [12.464332580566406, 41.90246868815924]
    ],
    inside1: [
        [12.45425820350647, 41.903925986557695],
        [12.454848289489746, 41.90402979284584],
        [12.455030679702759, 41.90410964372185],
        [12.457063794136047, 41.90400583756355]
    ],
    inside2: [
        [12.454526424407959, 41.90458076185763],
        [12.454580068588257, 41.90358661866875]
    ]
};

function center(...points: Array<Array<number>>): Point['coordinates'] {
    const s = 1e15;
    const c = s * points.length;
    const [x, y] = points
        .reduce(([x1, y1], [x2, y2]) => [x1 + (x2 * s), y1 + (y2 * s)], [0, 0]);

    return [x / c, y / c];
}

function geometry<T extends Geometries>(type: T['type'], coordinates: Array<unknown>): T {
    return {
        type,
        coordinates: coordinates.slice() as T['coordinates'],
    } as T;
}

function geometryCollection(...geometries: Array<Geometries | GeometryCollection>): GeometryCollection {
    return {
        type: 'GeometryCollection',
        geometries,
    };
}

function feature(geometry: Geometries): Feature {
    return {
        type: 'Feature',
        properties: null,
        geometry,
    };
}

function featureCollection(...features: Array<Feature | Geometries>): FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: features.map((geo) => geo.type === 'Feature' ? geo : feature(geo)),
    };
}

export const shapes: Array<{ a: GeoJSON, b: GeoJSON, intersect: boolean }> = [
    // Point <-> Point
    { a: geometry<Point>('Point', relative.inside1[0]), b: geometry<Point>('Point', relative.inside1[0]), intersect: true },
    { a: geometry<Point>('Point', relative.inside1[0]), b: geometry<Point>('Point', relative.inside1[1]), intersect: false },

    // MultiPoint <-> Point
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: geometry<Point>('Point', relative.inside1[0]), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: geometry<Point>('Point', center(relative.inside1[0], relative.inside1[1])), intersect: false },
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: geometry<Point>('Point', center(relative.inside2[0], relative.inside2[1])), intersect: false },
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: geometry<Point>('Point', relative.inside2[1]), intersect: false },

    // LineString <-> Point
    { a: geometry<LineString>('LineString', relative.inside1), b: geometry<Point>('Point', relative.inside1[0]), intersect: true },
    { a: geometry<LineString>('LineString', relative.inside1), b: geometry<Point>('Point', center(relative.inside1[0], relative.inside1[1])), intersect: true },
    { a: geometry<LineString>('LineString', relative.inside1), b: geometry<Point>('Point', center(relative.inside2[0], relative.inside2[1])), intersect: false },
    { a: geometry<LineString>('LineString', relative.inside1), b: geometry<Point>('Point', relative.inside2[1]), intersect: false },

    // MultiLineString <-> Point
    { a: geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.inside1]), b: geometry<Point>('Point', relative.inside1[0]), intersect: true },
    { a: geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.inside1]), b: geometry<Point>('Point', center(relative.inside1[0], relative.inside1[1])), intersect: true },
    { a: geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.inside1]), b: geometry<Point>('Point', center(relative.inside2[0], relative.inside2[1])), intersect: false },
    { a: geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.inside1]), b: geometry<Point>('Point', relative.inside2[1]), intersect: false },

    // Polygon <-> Point
    { a: HolySee.polygon, b: geometry<Point>('Point', relative.inside1[0]), intersect: true },
    { a: HolySee.polygon, b: geometry<Point>('Point', relative.outside1[0]), intersect: false },
    { a: SanMarino.polygon, b: geometry<Point>('Point', relative.inside1[0]), intersect: false },
    { a: geometry<Polygon>('Polygon', Italy.coordinates[0]), b: geometry<Point>('Point', relative.inside1[0]), intersect: false },
    { a: geometry<Polygon>('Polygon', Italy.coordinates[0]), b: geometry<Point>('Point', relative.outside1[0]), intersect: true },

    // MultiPolygon <-> Point
    { a: Italy.multipolygon, b: geometry<Point>('Point', relative.inside1[0]), intersect: false },
    { a: Italy.multipolygon, b: geometry<Point>('Point', relative.inside2[0]), intersect: false },
    { a: Italy.multipolygon, b: geometry<Point>('Point', relative.outside1[0]), intersect: true },
    { a: Italy.multipolygon, b: geometry<Point>('Point', relative.outside2[0]), intersect: true },
    {
        a: geometry<MultiPolygon>('MultiPolygon', [[[[8, 8], [8, 9], [9, 9], [9, 8], [8, 8]]], [[[0, 0], [0, 7], [7, 7], [7, 0], [0, 0]]]]),
        b: geometry<Point>('Point', [3, 3]),
        intersect: true,
    },

    // GeometryCollection <-> Point
    { a: geometryCollection(geometry<Point>('Point', relative.inside1[0])), b: geometry<Point>('Point', relative.inside1[0]), intersect: true },
    { a: geometryCollection(geometry<MultiPoint>('MultiPoint', relative.inside1)), b: geometry<Point>('Point', relative.inside2[1]), intersect: false },

    // Feature <-> Point
    { a: feature(Italy.multipolygon), b: geometry<Point>('Point', relative.outside1[0]), intersect: true },
    { a: feature(HolySee.polygon), b: geometry<Point>('Point', relative.outside1[0]), intersect: false },

    // FeatureCollection <-> Point
    { a: featureCollection(geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.inside1])), b: geometry<Point>('Point', relative.inside1[0]), intersect: true },
    { a: featureCollection(geometry<MultiPoint>('MultiPoint', relative.inside1)), b: geometry<Point>('Point', relative.inside2[1]), intersect: false },


    // MultiPoint <-> MultiPoint
    { a: geometry<MultiPoint>('MultiPoint', [relative.inside1[0], relative.inside1[1]]), b: geometry<MultiPoint>('MultiPoint', [relative.inside1[1], relative.inside1[2]]), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', [relative.outside1[0], relative.outside1[1]]), b: geometry<MultiPoint>('MultiPoint', [relative.outside1[1], relative.outside1[2]]), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', [relative.inside1[0], relative.inside1[1]]), b: geometry<MultiPoint>('MultiPoint', [relative.inside1[2], relative.inside1[3]]), intersect: false },
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: geometry<MultiPoint>('MultiPoint', relative.inside2), intersect: false },

    // MultiPoint <-> LineString
    { a: geometry<MultiPoint>('MultiPoint', [relative.inside1[0], relative.inside1[1]]), b: geometry<LineString>('LineString', [relative.inside1[1], relative.inside1[2]]), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', [relative.outside1[0], relative.outside1[1]]), b: geometry<LineString>('LineString', [relative.outside1[1], relative.outside1[2]]), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', [relative.outside1[0], center(relative.outside1[0], relative.outside1[1])]), b: geometry<LineString>('LineString', relative.outside1), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', [relative.inside1[0], relative.inside1[1]]), b: geometry<LineString>('LineString', [relative.inside1[2], relative.inside1[3]]), intersect: false },
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: geometry<LineString>('LineString', relative.inside2), intersect: false },

    // MultiPoint <-> MultiLineString
    { a: geometry<MultiPoint>('MultiPoint', [relative.inside1[0], relative.inside1[1]]), b: geometry<MultiLineString>('MultiLineString', [[relative.inside1[1], relative.inside1[2]], relative.outside1]), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', [relative.outside1[0], relative.outside1[1]]), b: geometry<MultiLineString>('MultiLineString', [[relative.outside1[1], relative.outside1[2]], relative.inside2]), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', [relative.outside1[0], center(relative.outside1[0], relative.outside1[1])]), b: geometry<MultiLineString>('MultiLineString', [relative.inside1, relative.outside1]), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', [relative.inside1[0], relative.inside1[1]]), b: geometry<MultiLineString>('MultiLineString', [relative.inside2, relative.outside1]), intersect: false },
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: geometry<MultiLineString>('MultiLineString', [relative.inside2, relative.outside1]), intersect: false },

    // MultiPoint <-> Polygon
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: HolySee.polygon, intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', relative.partial), b: HolySee.polygon, intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', relative.outside1), b: HolySee.polygon, intersect: false },

    // MultiPoint <-> MultiPolygon
    { a: geometry<MultiPoint>('MultiPoint', relative.partial), b: Italy.multipolygon, intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', relative.outside1), b: Italy.multipolygon, intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: Italy.multipolygon, intersect: false },

    // MultiPoint <-> GeometryCollection
    { a: geometry<MultiPoint>('MultiPoint', relative.partial), b: geometryCollection(Italy.multipolygon), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', relative.outside1), b: geometryCollection(HolySee.polygon), intersect: false },

    // MultiPoint <-> Feature
    { a: geometry<MultiPoint>('MultiPoint', [relative.inside1[0], relative.inside1[1]]), b: feature(geometry<MultiPoint>('MultiPoint', [relative.inside1[1], relative.inside1[2]])), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: feature(geometry<MultiLineString>('MultiLineString', [relative.inside2, relative.outside1])), intersect: false },

    // MultiPoint <-> FeatureCollection
    { a: geometry<MultiPoint>('MultiPoint', [relative.inside1[0], relative.inside1[1]]), b: featureCollection(geometry<MultiPoint>('MultiPoint', [relative.inside1[1], relative.inside1[2]])), intersect: true },
    { a: geometry<MultiPoint>('MultiPoint', relative.inside1), b: featureCollection(Italy.multipolygon), intersect: false },


    // LineString <-> LineString
    { a: geometry<LineString>('LineString', relative.inside1), b: geometry<LineString>('LineString', relative.inside2), intersect: true },
    { a: geometry<LineString>('LineString', relative.inside1), b: geometry<LineString>('LineString', relative.outside1), intersect: false },
    { a: geometry<LineString>('LineString', relative.inside1), b: geometry<LineString>('LineString', relative.outside2), intersect: false },

    // Polygon <-> LineString
    { a: HolySee.polygon, b: geometry<LineString>('LineString', relative.inside2), intersect: true },
    { a: HolySee.polygon, b: geometry<LineString>('LineString', relative.partial), intersect: true },
    { a: HolySee.polygon, b: geometry<LineString>('LineString', relative.outside2), intersect: false },

    // MultiPolygon <-> LineString
    { a: Italy.multipolygon, b: geometry<LineString>('LineString', relative.partial), intersect: true },
    { a: Italy.multipolygon, b: geometry<LineString>('LineString', relative.outside2), intersect: true },
    { a: Italy.multipolygon, b: geometry<LineString>('LineString', relative.inside2), intersect: false },

    // GeometryCollection <-> LineString
    { a: geometryCollection(geometry<LineString>('LineString', relative.inside1)), b: geometry<LineString>('LineString', relative.inside2), intersect: true },
    { a: geometryCollection(HolySee.polygon), b: geometry<LineString>('LineString', relative.outside2), intersect: false },

    // Feature <-> LineString
    { a: feature(HolySee.polygon), b: geometry<LineString>('LineString', relative.inside2), intersect: true },
    { a: feature(geometry<LineString>('LineString', relative.inside1)), b: geometry<LineString>('LineString', relative.outside1), intersect: false },

    // FeatureCollection <-> LineString
    { a: featureCollection(HolySee.polygon), b: geometry<LineString>('LineString', relative.partial), intersect: true },
    { a: featureCollection(Italy.multipolygon), b: geometry<LineString>('LineString', relative.inside2), intersect: false },


    // MultiLineString <-> LineString
    { a: geometry<MultiLineString>('MultiLineString', [relative.partial, relative.inside1]), b: geometry<LineString>('LineString', relative.inside2), intersect: true },
    { a: geometry<MultiLineString>('MultiLineString', [relative.partial, relative.outside1]), b: geometry<LineString>('LineString', relative.inside2), intersect: false },

    // MultiLineString <-> MultiLineString
    { a: geometry<MultiLineString>('MultiLineString', [relative.partial, relative.inside2]), b: geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.inside1]), intersect: true },
    { a: geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.outside2]), b: geometry<MultiLineString>('MultiLineString', [relative.inside1, relative.inside2]), intersect: false },

    // MultiLineString <-> Polygon
    { a: geometry<MultiLineString>('MultiLineString', [relative.inside1, relative.outside2]), b: HolySee.polygon, intersect: true },
    { a: geometry<MultiLineString>('MultiLineString', [relative.partial, relative.outside2]), b: HolySee.polygon, intersect: true },
    { a: geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.outside2]), b: HolySee.polygon, intersect: false },

    // MultiLineString <-> MultiPolygon
    { a: geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.outside2]), b: Italy.multipolygon, intersect: true },
    { a: geometry<MultiLineString>('MultiLineString', [relative.outside2, relative.partial]), b: Italy.multipolygon, intersect: true },
    { a: geometry<MultiLineString>('MultiLineString', [relative.inside1, relative.inside2]), b: Italy.multipolygon, intersect: false },

    // MultiLineString <-> GeometryCollection
    { a: geometry<MultiLineString>('MultiLineString', [relative.partial, relative.inside2]), b: geometryCollection(geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.inside1])), intersect: true },
    { a: geometry<MultiLineString>('MultiLineString', [relative.inside1, relative.inside2]), b: geometryCollection(Italy.multipolygon), intersect: false },

    // MultiLineString <-> Feature
    { a: geometry<MultiLineString>('MultiLineString', [relative.partial, relative.inside1]), b: feature(geometry<LineString>('LineString', relative.inside2)), intersect: true },
    { a: geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.outside2]), b: feature(HolySee.polygon), intersect: false },

    // MultiLineString <-> FeatureCollection
    { a: geometry<MultiLineString>('MultiLineString', [relative.inside1, relative.inside2]), b: featureCollection(Italy.multipolygon), intersect: false },
    { a: geometry<MultiLineString>('MultiLineString', [relative.outside1, relative.outside2]), b: featureCollection(geometry<MultiLineString>('MultiLineString', [relative.inside1, relative.inside2])), intersect: false },


    // Polygon <-> Polygon
    { a: geometry<Polygon>('Polygon', [Italy.coordinates[0][0]]), b: HolySee.polygon, intersect: true },
    { a: geometry<Polygon>('Polygon', [Italy.coordinates[0][0]]), b: SanMarino.polygon, intersect: true },
    { a: SanMarino.polygon, b: HolySee.polygon, intersect: false },

    // Polygon <-> MultiPolygon
    { a: HolySee.polygon, b: geometry<MultiPolygon>('MultiPolygon', [[Italy.coordinates[0][0]], [Italy.coordinates[1]]]), intersect: true },
    { a: SanMarino.polygon, b: geometry<MultiPolygon>('MultiPolygon', [[Italy.coordinates[0][0]], [Italy.coordinates[1]]]), intersect: true },
    { a: geometry<Polygon>('Polygon', Italy.coordinates[1]), b: geometry<MultiPolygon>('MultiPolygon', [HolySee.polygon.coordinates, SanMarino.polygon.coordinates]), intersect: false },

    // Polygon <-> GeometryCollection
    { a: geometry<Polygon>('Polygon', [Italy.coordinates[0][0]]), b: geometryCollection(HolySee.polygon), intersect: true },
    { a: SanMarino.polygon, b: geometryCollection(HolySee.polygon), intersect: false },

    // Polygon <-> Feature
    { a: HolySee.polygon, b: feature(geometry<MultiPolygon>('MultiPolygon', [[Italy.coordinates[0][0]], [Italy.coordinates[1]]])), intersect: true },
    { a: geometry<Polygon>('Polygon', Italy.coordinates[1]), b: feature(geometry<MultiPolygon>('MultiPolygon', [HolySee.polygon.coordinates, SanMarino.polygon.coordinates])), intersect: false },

    // Polygon <-> FeatureCollection
    { a: geometry<Polygon>('Polygon', [Italy.coordinates[0][0]]), b: featureCollection(SanMarino.polygon), intersect: true },
    { a: SanMarino.polygon, b: featureCollection(HolySee.polygon), intersect: false },


    // MultiPolygon <-> MultiPolygon
    { a: Italy.multipolygon, b: geometry<MultiPolygon>('MultiPolygon', [HolySee.polygon.coordinates, SanMarino.polygon.coordinates]), intersect: true },
    { a: geometry<MultiPolygon>('MultiPolygon', [HolySee.polygon.coordinates, SanMarino.polygon.coordinates]), b: geometry<MultiPolygon>('MultiPolygon', Italy.coordinates.slice(1)), intersect: false },

    // MultiPolygon <-> GeometryCollection
    { a: Italy.multipolygon, b: geometryCollection(geometry<MultiPolygon>('MultiPolygon', [HolySee.polygon.coordinates, SanMarino.polygon.coordinates])), intersect: true },
    { a: geometry<MultiPolygon>('MultiPolygon', [HolySee.polygon.coordinates, SanMarino.polygon.coordinates]), b: geometryCollection(geometry<MultiPolygon>('MultiPolygon', Italy.coordinates.slice(1))), intersect: false },

    // MultiPolygon <-> Feature
    { a: Italy.multipolygon, b: feature(geometry<MultiPolygon>('MultiPolygon', [HolySee.polygon.coordinates, SanMarino.polygon.coordinates])), intersect: true },
    { a: geometry<MultiPolygon>('MultiPolygon', [HolySee.polygon.coordinates, SanMarino.polygon.coordinates]), b: feature(geometry<MultiPolygon>('MultiPolygon', Italy.coordinates.slice(1))), intersect: false },

    // MultiPolygon <-> FeatureCollection];
    { a: Italy.multipolygon, b: featureCollection(geometry<MultiPolygon>('MultiPolygon', [HolySee.polygon.coordinates, SanMarino.polygon.coordinates])), intersect: true },
    { a: geometry<MultiPolygon>('MultiPolygon', [HolySee.polygon.coordinates, SanMarino.polygon.coordinates]), b: featureCollection(geometry<MultiPolygon>('MultiPolygon', Italy.coordinates.slice(1))), intersect: false },


    // GeometryCollection <-> GeometryCollection
    { a: geometryCollection(geometry<Point>('Point', relative.outside1[1])), b: geometryCollection(geometry<LineString>('LineString', relative.outside1)), intersect: true },
    { a: geometryCollection(geometry<Point>('Point', relative.outside1[1])), b: geometryCollection(geometry<LineString>('LineString', relative.outside2)), intersect: false },

    // GeometryCollection <-> Feature
    { a: geometryCollection(geometry<Point>('Point', relative.outside1[1])), b: feature(geometry<LineString>('LineString', relative.outside1)), intersect: true },
    { a: geometryCollection(geometry<Point>('Point', relative.outside1[1])), b: feature(geometry<LineString>('LineString', relative.outside2)), intersect: false },

    // GeometryCollection <-> FeatureCollection
    { a: geometryCollection(geometry<Point>('Point', relative.outside1[1])), b: featureCollection(geometry<LineString>('LineString', relative.outside1)), intersect: true },
    { a: geometryCollection(geometry<Point>('Point', relative.outside1[1])), b: featureCollection(geometry<LineString>('LineString', relative.outside2)), intersect: false },


    // Feature <-> Feature
    { a: feature(geometry<Point>('Point', relative.outside1[1])), b: feature(geometry<LineString>('LineString', relative.outside1)), intersect: true },
    { a: feature(geometry<Point>('Point', relative.outside1[1])), b: feature(geometry<LineString>('LineString', relative.outside2)), intersect: false },

    // Feature <-> FeatureCollection
    { a: feature(geometry<Point>('Point', relative.outside1[1])), b: featureCollection(geometry<LineString>('LineString', relative.outside1)), intersect: true },
    { a: feature(geometry<Point>('Point', relative.outside1[1])), b: featureCollection(geometry<LineString>('LineString', relative.outside2)), intersect: false },


    // FeatureCollection <-> FeatureCollection
    { a: featureCollection(geometry<Point>('Point', relative.outside1[1])), b: featureCollection(geometry<LineString>('LineString', relative.outside1)), intersect: true },
    { a: featureCollection(geometry<Point>('Point', relative.outside1[1])), b: featureCollection(geometry<LineString>('LineString', relative.outside2)), intersect: false },

    // Impossible <-> Possible
    { a: { type: 'Impossible', coordinates: [0, 0] } as any, b: geometry<Point>('Point', [0, 0]), intersect: false },
    { a: geometry<Point>('Point', [0, 0]), b: { type: 'Impossible', coordinates: [0, 0] } as any, intersect: false },
];
