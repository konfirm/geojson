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
export const shapes: Array<{ a: GeoJSON, b: GeoJSON, direct: number, haversine: number, vincenty: number }> = [
    { a: { type: 'Point', coordinates: [0, 0] }, b: { type: 'Point', coordinates: [1, 0] }, direct: 111195.07973436874, haversine: 111195.07973436874, vincenty: 111319.49079322325 },
    { a: { type: 'Point', coordinates: [0, 0] }, b: { type: 'Point', coordinates: [1, 1] }, direct: 157253.589829502, haversine: 157249.5977681334, vincenty: 156899.56829129544 },

    { a: { type: 'Point', coordinates: [1, 1] }, b: { type: 'LineString', coordinates: [[0, 2], [2, 2]] }, direct: 111195.07973436874, haversine: 111195.07973436874, vincenty: 110575.06481449273 },
    { a: { type: 'Point', coordinates: [1, 1] }, b: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, direct: 0, haversine: 0, vincenty: 0 },
    { a: { type: 'Point', coordinates: [3, 3] }, b: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, direct: 157253.589829502, haversine: 157177.7682119375, vincenty: 156829.3291160335 },
    { a: { type: 'Point', coordinates: [0, 1] }, b: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, direct: 78626.794914751, haversine: 78623.30209761004, vincenty: 78448.3205183003 },
    { a: { type: 'Point', coordinates: [1, 0] }, b: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, direct: 78626.794914751, haversine: 78626.29592703035, vincenty: 78451.24803121673 },

    { a: { type: 'MultiPoint', coordinates: [[9, 9], [1, 0]] }, b: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, direct: 78626.794914751, haversine: 78626.29592703035, vincenty: 78451.24803121673 },
    { a: { type: 'Point', coordinates: [1, 0] }, b: { type: 'MultiLineString', coordinates: [[[100, 100], [200, 200]], [[0, 0], [2, 2]]] }, direct: 78626.794914751, haversine: 78626.29592703035, vincenty: 78451.24803121673 },
    { a: { type: 'MultiPoint', coordinates: [[9, 9], [1, 0]] }, b: { type: 'MultiLineString', coordinates: [[[100, 100], [200, 200]], [[0, 0], [2, 2]]] }, direct: 78626.794914751, haversine: 78626.29592703035, vincenty: 78451.24803121673 },

    { a: { type: 'Point', coordinates: [2, 2] }, b: { type: 'Polygon', coordinates: [[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]]] }, direct: 0, haversine: 0, vincenty: 0 },
    { a: { type: 'Point', coordinates: [5, 2] }, b: { type: 'Polygon', coordinates: [[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]]] }, direct: 111195.07973436874, haversine: 111127.34097821356, vincenty: 111252.12980016059 },
    { a: { type: 'Point', coordinates: [2, 2] }, b: { type: 'Polygon', coordinates: [[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]], [[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]] }, direct: 111195.07973436874, haversine: 111127.34097821356, vincenty: 110575.06481449273 },

    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0]] }, b: { type: 'LineString', coordinates: [[0, 2], [0, 0]] }, direct: 0, haversine: 0, vincenty: 0 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0]] }, b: { type: 'LineString', coordinates: [[1, 2], [1, 0]] }, direct: 0, haversine: 0, vincenty: 0 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0]] }, b: { type: 'LineString', coordinates: [[3, 2], [3, 0]] }, direct: 111195.07973436874, haversine: 111195.07973436874, vincenty: 111319.49079322327 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0]] }, b: { type: 'LineString', coordinates: [[1, 1], [1, 3]] }, direct: 111195.07973436874, haversine: 111195.07973436874, vincenty: 110574.38855795695 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0]] }, b: { type: 'LineString', coordinates: [[1, 1], [3, 3]] }, direct: 111195.07973436874, haversine: 111195.07973436874, vincenty: 110574.38855795695 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 2]] }, b: { type: 'LineString', coordinates: [[2, 0], [0, 2]] }, direct: 0, haversine: 0, vincenty: 0 },
    { a: { type: 'LineString', coordinates: [[0, 0], [2, 0], [2, 2]] }, b: { type: 'LineString', coordinates: [[0, 2], [0, 0]] }, direct: 0, haversine: 0, vincenty: 0 },

    { a: { type: 'LineString', coordinates: [[2, 2], [3, 2]] }, b: { type: 'Polygon', coordinates: [[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]]] }, direct: 0, haversine: 0, vincenty: 0 },
    { a: { type: 'LineString', coordinates: [[1, 1], [10, 1]] }, b: poly, direct: 0, haversine: 0, vincenty: 0 },
    { a: { type: 'LineString', coordinates: [[1, 3], [4, 3]] }, b: poly, direct: 0, haversine: 0, vincenty: 0 },
    { a: { type: 'LineString', coordinates: [[3, 3], [4, 3]] }, b: poly, direct: 111195.07973436874, haversine: 111042.6868815999, vincenty: 110576.41652430617 },
    { a: { type: 'LineString', coordinates: [[7.5, 3], [8.5, 3]] }, b: poly, direct: 55597.53986718437, haversine: 55521.344888509884, vincenty: 55583.97477025055 },
    { a: { type: 'LineString', coordinates: [[3, 6], [3, 9]] }, b: poly, direct: 111195.07973436874, haversine: 110366.22766612672, vincenty: 110495.20453687456 },

    { a: { type: 'Polygon', coordinates: [[[0, 0], [0, 9], [9, 9], [9, 0], [0, 0]]] }, b: { type: 'Polygon', coordinates: [[[2, 2], [2, 7], [7, 7], [7, 2], [2, 2]]] }, direct: 0, haversine: 0, vincenty: 0 },
    { a: { type: 'Polygon', coordinates: [[[0, 0], [0, 9], [9, 9], [9, 0], [0, 0]], [[1, 1], [8, 1], [8, 8], [1, 8], [1, 1]]] }, b: { type: 'Polygon', coordinates: [[[2, 2], [2, 7], [7, 7], [7, 2], [2, 2]]] }, direct: 111195.07973436874, haversine: 110366.22766612672, vincenty: 110495.20453687456 },

    // // Impossible <-> Possible
    { a: { type: 'Impossible', coordinates: [0, 0] } as any, b: { type: 'Point', coordinates: [0, 0] }, direct: Infinity, haversine: Infinity, vincenty: Infinity },
    { a: { type: 'Point', coordinates: [0, 0] }, b: { type: 'Impossible', coordinates: [0, 0] } as any, direct: Infinity, haversine: Infinity, vincenty: Infinity },
];
