import { Point } from "../GeoJSON/Geometry/Point";

const D2R = Math.PI / 180;

function constrain(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min);
}

function squared(n: number): number {
    return n * n;
}

function rad(n: number): number {
    return n * D2R;
}

function sincos(n: number): [number, number] {
    return [Math.sin(n), Math.cos(n)];
}

const EARTH_RADIUS = 6371008.7714;         // mean radius
const EARTH_RADIUS_MAJOR = 6378137;        // equatorial radius
const EARTH_RADIUS_MINOR = 6356752.314245; // semiminor axis
const EARTH_RADIUS_MAJOR_SQUARED = squared(EARTH_RADIUS_MAJOR);
const EARTH_RADIUS_MINOR_SQUARED = squared(EARTH_RADIUS_MINOR);
const EARTH_RADIUS_FACTOR = (EARTH_RADIUS_MAJOR_SQUARED - EARTH_RADIUS_MINOR_SQUARED) / EARTH_RADIUS_MINOR_SQUARED;
const EARTH_FLATTENING = 298.257223563;
const EARTH_INVERSE_FLATTENING = 1 / EARTH_FLATTENING;


const PointToPoint: { [key: string]: (...positions: [Point['coordinates'], Point['coordinates']]) => number } = {
    direct([λa, φa], [λb, φb]) {
        return EARTH_RADIUS * rad(Math.sqrt(squared(λb - λa) + squared(φb - φa)));
    },
    haversine([λa, φa], [λb, φb]) {
        //https://www.movable-type.co.uk/scripts/latlong.html
        const Δ = squared(Math.sin(rad(φb - φa) / 2)) + Math.cos(rad(φa)) * Math.cos(rad(φb)) * squared(Math.sin(rad(λb - λa) / 2));

        return EARTH_RADIUS * Math.atan2(Math.sqrt(Δ), Math.sqrt(1 - Δ)) * 2;
    },
    vincenty([λa, φa], [λb, φb]) {
        //https://www.movable-type.co.uk/scripts/latlong-vincenty.html
        const L = rad(λb - λa);
        const [sinU1, cosU1] = sincos(Math.atan((1 - EARTH_INVERSE_FLATTENING) * Math.tan(rad(φa))));
        const [sinU2, cosU2] = sincos(Math.atan((1 - EARTH_INVERSE_FLATTENING) * Math.tan(rad(φb))));

        let λ = L;
        let limit = 100;
        let λP, Σ, sinΣ, cosΣ, cosSqAlpha, cos2ΣM;

        do {
            const sinλ = Math.sin(λ);
            const cosλ = Math.cos(λ);
            sinΣ = Math.sqrt((cosU2 * sinλ) * (cosU2 * sinλ) + (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) * (cosU1 * sinU2 - sinU1 * cosU2 * cosλ));

            if (sinΣ == 0) return 0; // co-incident points

            cosΣ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
            Σ = Math.atan2(sinΣ, cosΣ);
            const sinAlpha = cosU1 * cosU2 * sinλ / sinΣ;
            cosSqAlpha = 1 - squared(sinAlpha);
            cos2ΣM = cosΣ - 2 * sinU1 * sinU2 / cosSqAlpha;

            if (isNaN(cos2ΣM)) cos2ΣM = 0; // equatorial line: cosSqAlpha=0 (§6)

            const C = EARTH_INVERSE_FLATTENING / 16 * cosSqAlpha * (4 + EARTH_INVERSE_FLATTENING * (4 - 3 * cosSqAlpha));

            λP = λ;
            λ = L + (1 - C) * EARTH_INVERSE_FLATTENING * sinAlpha * (Σ + C * sinΣ * (cos2ΣM + C * cosΣ * (-1 + 2 * cos2ΣM * cos2ΣM)));
        } while (Math.abs(λ - λP) > 1e-12 && --limit > 0);

        const uSq = cosSqAlpha * EARTH_RADIUS_FACTOR;
        const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
        const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
        const ΔΣ = B * sinΣ * (cos2ΣM + B / 4 * (cosΣ * (-1 + 2 * cos2ΣM * cos2ΣM) - B / 6 * cos2ΣM * (-3 + 4 * sinΣ * sinΣ) * (-3 + 4 * cos2ΣM * cos2ΣM)));
        const s = EARTH_RADIUS_MINOR * A * (Σ - ΔΣ);

        return s;
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
    return getDistanceOfPointToLine(point, line, 'direct') < threshold;
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
