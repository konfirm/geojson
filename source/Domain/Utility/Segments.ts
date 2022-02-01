import { Point } from '../GeoJSON/Geometry/Point';

export function segments(line: Array<Point['coordinates']>): Array<[Point['coordinates'], Point['coordinates']]> {
    return line.slice(1).map((point, index) => [line[index], point]);
}
