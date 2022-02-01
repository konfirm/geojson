import { GeoJSON } from '../GeoJSON/GeoJSON';
import { Point } from '../GeoJSON/Geometry/Point';

function getDistanceOfPointToPoint(...points: [Point['coordinates'], Point['coordinates']]): number {
    const [[ax, ay], [bx, by]] = points;

    return Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
}

export function getDistanceOfPointToLine(...points: [Point['coordinates'], Point['coordinates'], Point['coordinates']]): number {
    const [[px, py], [ax, ay], [bx, by]] = points;
    const L2 = (((bx - ax) * (bx - ax)) + ((by - ay) * (by - ay)));

    return L2 === 0
        ? getDistanceOfPointToPoint([px, py], [ax, ay])
        : Math.abs((((ay - py) * (bx - ax)) - ((ax - px) * (by - ay))) / L2) * Math.sqrt(L2);
}
