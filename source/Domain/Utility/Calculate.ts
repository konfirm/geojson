import { Point } from "../GeoJSON/Geometry/Point";

function constrain(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min);
}

export function getDistanceOfPointToPoint(...points: [Point['coordinates'], Point['coordinates']]): number {
    const [[ax, ay], [bx, by]] = points;

    return Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
}

export function getClosestPointOnLineByPoint(point: Point['coordinates'], line: [Point['coordinates'], Point['coordinates']]): Point['coordinates'] {
    const [[px, py], [ax, ay], [bx, by]] = [point, ...line];
    const [abx, aby] = [bx - ax, by - ay];
    const [apx, apy] = [px - ax, py - ay];
    const t = constrain((apx * abx + apy * aby) / (abx * abx + aby * aby), 0, 1);

    return t === 0 || t === 1 ? line[t] : [ax + abx * t, ay + aby * t];
}

export function isLinesCrossing(a: [Point['coordinates'], Point['coordinates']], b: [Point['coordinates'], Point['coordinates']]): boolean {
    const [[a1x, a1y], [a2x, a2y]] = a;
    const [[b1x, b1y], [b2x, b2y]] = b;
    const [s1x, s1y, s2x, s2y] = [a2x - a1x, a2y - a1y, b2x - b1x, b2y - b1y];
    const s = (-s1y * (a1x - b1x) + s1x * (a1y - b1y)) / (-s2x * s1y + s1x * s2y);
    const t = (s2x * (a1y - b1y) - s2y * (a1x - b1x)) / (-s2x * s1y + s1x * s2y);

    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

export function getDistanceOfPointToLine(point: Point['coordinates'], line: [Point['coordinates'], Point['coordinates']]): number {
    return getDistanceOfPointToPoint(point, getClosestPointOnLineByPoint(point, line));
}

export function getDistanceOfLineToLine(a: [Point['coordinates'], Point['coordinates']], b: [Point['coordinates'], Point['coordinates']]): number {
    return isLinesCrossing(a, b)
        ? 0
        : Math.min(...a.map((a) => getDistanceOfPointToLine(a, b)), ...b.map((b) => getDistanceOfPointToLine(b, a)));
}

export function isPointOnLine(point: Point['coordinates'], line: [Point['coordinates'], Point['coordinates']], threshold: number = 1e-14): boolean {
    return getDistanceOfPointToLine(point, line) < threshold;
}

export function isPointInRing(p: Point['coordinates'], ring: Array<Point['coordinates']>): boolean {
    const { length } = ring;
    const odd = ring
        .reduce((odd, a, i) => {
            const b = ring[(length + i - 1) % length];

            return (a[1] < p[1] && b[1] >= p[1] || b[1] < p[1] && a[1] >= p[1]) && (a[0] <= p[0] || b[0] <= p[0])
                ? odd ^ Number(a[0] + (p[1] - a[1]) / (b[1] - a[1]) * (b[0] - a[0]) < p[0])
                : odd;
        }, 0);

    return odd !== 0 || ring.slice(1).some((a, index) => isPointOnLine(p, [ring[index], a]));
}
