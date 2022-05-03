import { Point } from "../GeoJSON/Geometry/Point";

function constrain(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min);
}

function squared(n: number): number {
    return n * n;
}

function rad(n: number): number {
    return n * (Math.PI / 180);
}

const EARTH_RADIUS_MAJOR = 6378137;
const EARTH_RADIUS_MINOR = 6356752.3142;
const EARTH_RADIUS_MAJOR_SQUARED = squared(EARTH_RADIUS_MAJOR);
const EARTH_RADIUS_MINOR_SQUARED = squared(EARTH_RADIUS_MINOR);
const EARTH_RADIUS_FACTOR = EARTH_RADIUS_MINOR_SQUARED / EARTH_RADIUS_MAJOR_SQUARED;

const PointToPoint: { [key: string]: (...positions: [Point['coordinates'], Point['coordinates']]) => number } = {
    absolute([ax, ay], [bx, by]) {
        return Math.sqrt(squared(bx - ax) + squared(by - ay));
    },
    haversine([ax, ay], [bx, by]) {
        //http://www.movable-type.co.uk/scripts/latlong.html
        const [φa, φb, Δφ, Δλ] = [ay, by, by - ay, bx - ax].map((n) => n * Math.PI / 180);
        const a = squared(Math.sin(Δφ / 2)) + Math.cos(φa) * Math.cos(φb) * squared(Math.sin(Δλ / 2));

        return EARTH_RADIUS_MAJOR * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 2;
    },
    wgs84(...positions) {
        const [a, b] = positions;
        const [ea, eb] = positions.map((position): Point['coordinates'] => {
            const [, y, z = 0] = position;
            const pt = Math.atan(EARTH_RADIUS_FACTOR * Math.tan(rad(y))) * 180 / Math.PI;
            const ptr = rad(pt);
            const cos = Math.cos(ptr);
            const sin = Math.sin(ptr);
            const pr = z + 1 / Math.sqrt(squared(cos) / EARTH_RADIUS_MAJOR_SQUARED + squared(sin) / EARTH_RADIUS_MINOR_SQUARED);

            return [pr * cos, pr * sin];
        })

        return Math.sqrt(squared(PointToPoint.absolute(ea, eb)) + squared(Math.PI * ((ea[0] + eb[0]) / 360) * (a[0] - b[0])));
    },
};

export type PointToPointCalculation = keyof typeof PointToPoint | ((...position: [Point['coordinates'], Point['coordinates']]) => number);

export function getClosestPointOnLineByPoint(point: Point['coordinates'], line: [Point['coordinates'], Point['coordinates']]): Point['coordinates'] {
    const [[px, py], [ax, ay], [bx, by]] = [point, ...line];
    const [abx, aby] = [bx - ax, by - ay];
    const [apx, apy] = [px - ax, py - ay];
    const t = constrain((apx * abx + apy * aby) / (abx * abx + aby * aby), 0, 1);

    return t === 0 || t === 1 ? line[t] : [ax + abx * t, ay + aby * t];
}

export function getDistanceOfPointToPoint(a: Point['coordinates'], b: Point['coordinates'], calculation: PointToPointCalculation): number {
    const calc = typeof calculation === 'function' ? calculation : PointToPoint[calculation];

    if (typeof calc === 'function') {
        return calc(a, b);
    }

    throw new Error(`Not a PointToPoint calculation function ${calculation}`);
}

export function getDistanceOfPointToLine(point: Point['coordinates'], line: [Point['coordinates'], Point['coordinates']], calculation: PointToPointCalculation): number {
    return getDistanceOfPointToPoint(point, getClosestPointOnLineByPoint(point, line), calculation);
}

export function getDistanceOfLineToLine(a: [Point['coordinates'], Point['coordinates']], b: [Point['coordinates'], Point['coordinates']], calculation: PointToPointCalculation): number {
    return isLinesCrossing(a, b)
        ? 0
        : Math.min(...a.map((a) => getDistanceOfPointToLine(a, b, calculation)), ...b.map((b) => getDistanceOfPointToLine(b, a, calculation)));
}

export function isLinesCrossing(a: [Point['coordinates'], Point['coordinates']], b: [Point['coordinates'], Point['coordinates']]): boolean {
    const [[a1x, a1y], [a2x, a2y]] = a;
    const [[b1x, b1y], [b2x, b2y]] = b;
    const [s1x, s1y, s2x, s2y] = [a2x - a1x, a2y - a1y, b2x - b1x, b2y - b1y];
    const s = (-s1y * (a1x - b1x) + s1x * (a1y - b1y)) / (-s2x * s1y + s1x * s2y);
    const t = (s2x * (a1y - b1y) - s2y * (a1x - b1x)) / (-s2x * s1y + s1x * s2y);

    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

export function isPointOnLine(point: Point['coordinates'], line: [Point['coordinates'], Point['coordinates']], threshold: number = 1e-14): boolean {
    return getDistanceOfPointToLine(point, line, 'absolute') < threshold;
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
