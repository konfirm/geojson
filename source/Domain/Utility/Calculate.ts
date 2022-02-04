import { Point } from "../GeoJSON/Geometry/Point";

export function getDistanceOfLineToLine(a: [Point['coordinates'], Point['coordinates']], b: [Point['coordinates'], Point['coordinates']]): number {
    return isLinesCrossing(a, b)
        ? 0
        : Math.min(...a.map((a) => getDistanceOfPointToLine(a, b), ...b.map((b) => getDistanceOfPointToLine(b, a))));
}

export function isPointOnLine(point: Point['coordinates'], line: [Point['coordinates'], Point['coordinates']], threshold: number = 1e-14): boolean {
    return getDistanceOfPointToLine(point, line) < threshold;
}

export function isLinesCrossing(a: [Point['coordinates'], Point['coordinates']], b: [Point['coordinates'], Point['coordinates']]): boolean {
    const [[a1x, a1y], [a2x, a2y]] = a;
    const [[b1x, b1y], [b2x, b2y]] = b;
    const [s1x, s1y, s2x, s2y] = [a2x - a1x, a2y - a1y, b2x - b1x, b2y - b1y];
    const s = (-s1y * (a1x - b1x) + s1x * (a1y - b1y)) / (-s2x * s1y + s1x * s2y);
    const t = (s2x * (a1y - b1y) - s2y * (a1x - b1x)) / (-s2x * s1y + s1x * s2y);

    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
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

    return odd !== 0;
}