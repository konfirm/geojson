import { Point } from "../GeoJSON/Geometry/Point";
import { EARTH_RADIUS, EARTH_RADIUS_MAJOR, EARTH_RADIUS_MINOR, EARTH_FLATTENING } from '../Constants';

const D2R = Math.PI / 180;
const π = Math.PI;
const ε = Number.EPSILON;

function constrain(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min);
}

function squared(n: number): number {
    return n * n;
}

function rad(n: number): number {
    return n * D2R;
}

const EARTH_RADIUS_MAJOR_SQUARED = squared(EARTH_RADIUS_MAJOR);
const EARTH_RADIUS_MINOR_SQUARED = squared(EARTH_RADIUS_MINOR);
const EARTH_RADIUS_FACTOR = (EARTH_RADIUS_MAJOR_SQUARED - EARTH_RADIUS_MINOR_SQUARED) / EARTH_RADIUS_MINOR_SQUARED;
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
    vincenty(...points) {
        //https://www.movable-type.co.uk/scripts/latlong-vincenty.html
        const [[λ1, φ1], [λ2, φ2]] = points.map((p) => p.map(rad));
        const L = λ2 - λ1; // L = difference in longitude, U = reduced latitude, defined by tan U = (1-f)·tanφ.
        const tanU1 = (1 - EARTH_INVERSE_FLATTENING) * Math.tan(φ1), cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)), sinU1 = tanU1 * cosU1;
        const tanU2 = (1 - EARTH_INVERSE_FLATTENING) * Math.tan(φ2), cosU2 = 1 / Math.sqrt((1 + tanU2 * tanU2)), sinU2 = tanU2 * cosU2;

        const antipodal = Math.abs(L) > π / 2 || Math.abs(φ2 - φ1) > π / 2;

        let λ = L, sinλ = null, cosλ = null; // λ = difference in longitude on an auxiliary sphere
        let σ = antipodal ? π : 0, sinσ = 0, cosσ = antipodal ? -1 : 1, sinSqσ = null; // σ = angular distance P₁ P₂ on the sphere
        let cos2σₘ = 1;                      // σₘ = angular distance on the sphere from the equator to the midpoint of the line
        let cosSqα = 1;                      // α = azimuth of the geodesic at the equator

        let λʹ = null, iterations = 0;
        do {
            sinλ = Math.sin(λ);
            cosλ = Math.cos(λ);
            sinSqσ = (cosU2 * sinλ) ** 2 + (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) ** 2;
            if (Math.abs(sinSqσ) < 1e-24) break;  // co-incident/antipodal points (σ < ≈0.006mm)
            sinσ = Math.sqrt(sinSqσ);
            cosσ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
            σ = Math.atan2(sinσ, cosσ);
            const sinα = cosU1 * cosU2 * sinλ / sinσ;
            cosSqα = 1 - sinα * sinα;
            cos2σₘ = (cosSqα != 0) ? (cosσ - 2 * sinU1 * sinU2 / cosSqα) : 0; // on equatorial line cos²α = 0 (§6)
            const C = EARTH_INVERSE_FLATTENING / 16 * cosSqα * (4 + EARTH_INVERSE_FLATTENING * (4 - 3 * cosSqα));
            λʹ = λ;
            λ = L + (1 - C) * EARTH_INVERSE_FLATTENING * sinα * (σ + C * sinσ * (cos2σₘ + C * cosσ * (-1 + 2 * cos2σₘ * cos2σₘ)));
            // TODO: add tests
            // const iterationCheck = antipodal ? Math.abs(λ) - π : Math.abs(λ);
            // if (iterationCheck > π) throw new EvalError('λ > π');
        } while (Math.abs(λ - λʹ) > 1e-12 && ++iterations < 1000); // TV: 'iterate until negligible change in λ' (≈0.006mm)
        // TODO: add tests
        // if (iterations >= 1000) throw new EvalError('Vincenty formula failed to converge');

        const uSq = cosSqα * EARTH_RADIUS_FACTOR;
        const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
        const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
        const Δσ = B * sinσ * (cos2σₘ + B / 4 * (cosσ * (-1 + 2 * cos2σₘ * cos2σₘ) - B / 6 * cos2σₘ * (-3 + 4 * sinσ * sinσ) * (-3 + 4 * cos2σₘ * cos2σₘ)));

        return EARTH_RADIUS_MINOR * A * (σ - Δσ);
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
