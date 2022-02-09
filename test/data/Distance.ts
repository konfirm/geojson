import { GeoJSON } from '../../source/Domain/GeoJSON/GeoJSON';
import { Polygon } from '../../source/Domain/GeoJSON/Geometry/Polygon';

const poly: Polygon = {
    type: 'Polygon',
    coordinates: [
        [[0, 0], [0, 7], [2, 7], [2, 5], [4, 5], [4, 7], [7, 7], [7, 5], [9, 5], [9, 7], [11, 7], [11, 0], [0, 0]],
        [[2, 2], [5, 2], [5, 4], [2, 4], [2, 2]],
        [[7, 2], [9, 2], [9, 4], [7, 4], [7, 2]],
    ]
};
export const shapes: Array<{ a: GeoJSON, b: GeoJSON, distance: number }> = [
    { a: { type: 'Point', coordinates: [0, 0] }, b: { type: 'Point', coordinates: [1, 0] }, distance: 1 },
    { a: { type: 'Point', coordinates: [0, 0] }, b: { type: 'Point', coordinates: [1, 1] }, distance: 1.4142135623730951 },

    { a: { type: 'Point', coordinates: [1, 1] }, b: { type: 'LineString', coordinates: [[0, 2], [2, 2]] }, distance: 1 },
    { a: { type: 'Point', coordinates: [1, 1] }, b: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, distance: 0 },
    { a: { type: 'Point', coordinates: [3, 3] }, b: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, distance: 1.4142135623730951 },
    { a: { type: 'Point', coordinates: [0, 1] }, b: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, distance: 0.7071067811865476 },
    { a: { type: 'Point', coordinates: [1, 0] }, b: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, distance: 0.7071067811865476 },

    { a: { type: 'MultiPoint', coordinates: [[9, 9], [1, 0]] }, b: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, distance: 0.7071067811865476 },
    { a: { type: 'Point', coordinates: [1, 0] }, b: { type: 'MultiLineString', coordinates: [[[100, 100], [200, 200]], [[0, 0], [2, 2]]] }, distance: 0.7071067811865476 },
    { a: { type: 'MultiPoint', coordinates: [[9, 9], [1, 0]] }, b: { type: 'MultiLineString', coordinates: [[[100, 100], [200, 200]], [[0, 0], [2, 2]]] }, distance: 0.7071067811865476 },

    { a: { type: 'Point', coordinates: [2, 2] }, b: { type: 'Polygon', coordinates: [[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]]] }, distance: 0 },
    { a: { type: 'Point', coordinates: [5, 2] }, b: { type: 'Polygon', coordinates: [[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]]] }, distance: 1 },
    { a: { type: 'Point', coordinates: [2, 2] }, b: { type: 'Polygon', coordinates: [[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]], [[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]] }, distance: 1 },

    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0]] }, b: { type: 'LineString', coordinates: [[0, 2], [0, 0]] }, distance: 0 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0]] }, b: { type: 'LineString', coordinates: [[1, 2], [1, 0]] }, distance: 0 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0]] }, b: { type: 'LineString', coordinates: [[3, 2], [3, 0]] }, distance: 1 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0]] }, b: { type: 'LineString', coordinates: [[1, 1], [1, 3]] }, distance: 1 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0]] }, b: { type: 'LineString', coordinates: [[1, 1], [3, 3]] }, distance: 1 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, b: { type: 'LineString', coordinates: [[2, 0], [0, 2]] }, distance: 0 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0], [2, 2]] }, b: { type: 'LineString', coordinates: [[0, 2], [0, 0]] }, distance: 0 },

    { a: { type: 'LineString', coordinates: [[2, 2], [3, 2]] }, b: { type: 'Polygon', coordinates: [[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]]] }, distance: 0 },
    { a: { type: 'LineString', coordinates: [[1, 1], [10, 1]] }, b: poly, distance: 0 },
    { a: { type: 'LineString', coordinates: [[1, 3], [4, 3]] }, b: poly, distance: 0 },
    { a: { type: 'LineString', coordinates: [[3, 3], [4, 3]] }, b: poly, distance: 1 },
    { a: { type: 'LineString', coordinates: [[7.5, 3], [8.5, 3]] }, b: poly, distance: 0.5 },
    { a: { type: 'LineString', coordinates: [[3, 6], [3, 9]] }, b: poly, distance: 1 },

    { a: { type: 'Polygon', coordinates: [[[0, 0], [0, 9], [9, 9], [9, 0], [0, 0]]] }, b: { type: 'Polygon', coordinates: [[[2, 2], [2, 7], [7, 7], [7, 2], [2, 2]]] }, distance: 0 },
    { a: { type: 'Polygon', coordinates: [[[0, 0], [0, 9], [9, 9], [9, 0], [0, 0]], [[1, 1], [8, 1], [8, 8], [1, 8], [1, 1]]] }, b: { type: 'Polygon', coordinates: [[[2, 2], [2, 7], [7, 7], [7, 2], [2, 2]]] }, distance: 1 },

    // Impossible <-> Possible
    { a: { type: 'Impossible', coordinates: [0, 0] } as any, b: { type: 'Point', coordinates: [0, 0] }, distance: Infinity },
    { a: { type: 'Point', coordinates: [0, 0] }, b: { type: 'Impossible', coordinates: [0, 0] } as any, distance: Infinity },
];
