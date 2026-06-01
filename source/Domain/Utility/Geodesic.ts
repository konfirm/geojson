/**
 * Inverse geodesic distance on WGS84 using Karney's algorithm.
 * Reference: Karney (2013) "Algorithms for geodesics", J. Geodesy 87:43–55
 * Series coefficients adapted from GeographicLib (MIT) by Charles F. F. Karney
 *
 * Notation used throughout (follows the paper):
 *   β  – parametric (reduced) latitude: tan β = (1−f) tan φ
 *   α  – azimuth of the geodesic
 *   α₀ – equatorial azimuth
 *   σ  – arc length on the auxiliary sphere
 *   ω  – longitude on the auxiliary sphere
 *   Λ  – longitude difference on the ellipsoid
 *   ε  – series parameter: k² / (2(1+√(1+k²)) + k²), where k² = cos²α₀ · e′²
 *   n  – third flattening: f / (2−f)
 *   e′²– second eccentricity squared: (a²−b²) / b²
 *
 *   Prefix conventions: s = sin, c = cos, d = √(1 + e′² sin²β)
 *   Subscript 1/2 = point 1 / point 2; 12 = quantity at point 2 minus point 1
 */
import { EARTH_FLATTENING, EARTH_RADIUS_MAJOR } from '../Constants';
import { values } from './Common';
import { squared } from './Numeric';

// ── WGS84 ──────────────────────────────────────────────────────────────────
const a = EARTH_RADIUS_MAJOR; // equatorial radius, m
const f = 1 / EARTH_FLATTENING; // flattening ≈ 1/298.257 (oblate, f > 0)
// If f ever becomes negative (prolate ellipsoid), search for
// "Prolate ellipsoid (f < 0)" in this file to find the three branches
// that need to be restored and tested.
const f1 = 1 - f; // (1 − f)
const n = f / (2 - f); // third flattening
const b = a * f1; // semi-minor axis, m
const ep2 = (f * (2 - f)) / (f1 * f1); // e′²
const D2R = Math.PI / 180;

// ── Tolerances ─────────────────────────────────────────────────────────────
const TINY = Number.EPSILON;
const TOL0 = Number.EPSILON;
const TOL1 = 200 * TOL0;
const TOL2 = Math.sqrt(TOL0);
const TOLB = TOL0 * TOL2;
const XTHRESH = 1000 * TOL2;
const MAXIT1 = 20;
const MAXIT2 = MAXIT1 + 80;
const ETOL2 =
	(0.1 * TOL2) /
	Math.sqrt((Math.max(0.001, Math.abs(f)) * Math.min(1, 1 - f / 2)) / 2);

const ORDER = 6; // series truncation order

// ── Series coefficient arrays (Karney 2013, Table 1) ──────────────────────
// Each block encodes polynomial-in-ε² coefficients followed by a denominator.
// Evaluated by polyval(); A3/C3 arrays are further reduced to polynomials in n
// at module load time by buildA3x/buildC3x.

// A₁ − 1: (1−ε)·A₁ − 1 as polynomial in ε² (eq. 17)
const A1M1_COEFF = [1, 4, 64, 0, 256];

// C₁[l] / ε^l as polynomials in ε² (eq. 18)
const C1_COEFF = values`
	${-1}     ${6}  ${-16}     ${32},
	${-9}    ${64}  ${-128}  ${2048},
	 ${9}   ${-16}  ${768}
	 ${3}    ${-5}  ${512}
	${-7}  ${1280}
	${-7}  ${2048}
`;

// A₂ − 1: (1+ε)·A₂ − 1 as polynomial in ε² (for reduced length m₁₂)
const A2M1_COEFF = [-11, -28, -192, 0, 256];

// C₂[l] / ε^l as polynomials in ε²
const C2_COEFF = values`
	 ${1}     ${2}   ${16}    ${32}
	${35}    ${64}  ${384}  ${2048}
	${15}    ${80}  ${768}
	 ${7}    ${35}  ${512}
	${63}  ${1280}
	${77}  ${2048}
`;

// A₃ coefficients: polynomials in n for each power of ε (eq. 24)
const A3_COEFF = values`
	${-3}  ${128}
	${-2}   ${-3}  ${64}
	${-1}   ${-3}  ${-1}  ${16}
	 ${3}   ${-1}  ${-2}   ${8}
	 ${1}   ${-1}   ${2}
	 ${1}    ${1}
`;

// C₃[l] coefficients: polynomials in n for each power of ε (eq. 25)
const C3_COEFF = values`
	  ${3}   ${128}
	  ${2}     ${5}  ${128}
 	 ${-1}     ${3}    ${3}   ${64}
	 ${-1}     ${0}    ${1}    ${8}
	 ${-1}     ${1}    ${4}
	  ${5}   ${256}
	  ${1}     ${3}  ${128}
	 ${-3}    ${-2}    ${3}   ${64}
	  ${1}    ${-3}    ${2}   ${32}
	  ${7}   ${512}
	${-10}     ${9}  ${384}
	  ${5}    ${-9}    ${5}  ${192}
	  ${7}   ${512}
	${-14}     ${7}  ${512}
	 ${21}  ${2560}
`;

// ── Low-level utilities ────────────────────────────────────────────────────
// Avoids Math.hypot whose precision degrades on some engines for small values
function hypot(x: number, y: number): number {
	return Math.sqrt(x * x + y * y);
}
function copysign(x: number, y: number): number {
	return Math.abs(x) * (y < 0 || (y === 0 && 1 / y < 0) ? -1 : 1);
}
// Horner's method: evaluates p[s]·x^N + p[s+1]·x^(N−1) + … + p[s+N]
function polyval(N: number, p: Array<number>, s: number, x: number): number {
	let i = s;
	let n = N;
	let y = n < 0 ? 0 : p[i++];
	while (n-- > 0) y = y * x + p[i++];
	return y;
}
function angNormalize(x: number): number {
	const v = x % 360;
	return v <= -180 ? v + 360 : v > 180 ? v - 360 : v;
}

// Clenshaw summation for Σ c[k]·sin(2k·x) (sinp=true) or Σ c[k]·cos((2k+1)·x)
function sinCosSeries(
	sinp: boolean,
	sinx: number,
	cosx: number,
	c: Array<number>,
): number {
	let k = c.length;
	let cn = k - (sinp ? 1 : 0);
	const ar = 2 * (cosx - sinx) * (cosx + sinx); // 2·cos(2x)
	let y0 = cn & 1 ? c[--k] : 0;
	let y1 = 0;
	cn = Math.floor(cn / 2);
	while (cn--) {
		y1 = ar * y0 - y1 + c[--k];
		y0 = ar * y1 - y0 + c[--k];
	}
	return sinp ? 2 * sinx * cosx * y0 : cosx * (y0 - y1);
}

// Solves k⁴+2k³−(x²+y²−1)k²−2y²k−y²=0 for the positive root k.
// Used to estimate the initial azimuth for near-antipodal pairs (§8).
function astroid(x: number, y: number): number {
	const p = squared(x);
	const q = squared(y);
	const r = (p + q - 1) / 6;
	if (!(q === 0 && r <= 0)) {
		const S = (p * q) / 4;
		const r2 = squared(r);
		const r3 = r * r2;
		const disc = S * (S + 2 * r3);
		let u = r;
		if (disc >= 0) {
			let T3 = S + r3;
			T3 += T3 < 0 ? -Math.sqrt(disc) : Math.sqrt(disc);
			const T = Math.cbrt(T3);
			u += T + (T !== 0 ? r2 / T : 0);
		} else {
			const ang = Math.atan2(Math.sqrt(-disc), -(S + r3));
			u += 2 * r * Math.cos(ang / 3);
		}
		const v = Math.sqrt(squared(u) + q);
		const uv = u < 0 ? q / (v - u) : u + v;
		const w = (uv - q) / (2 * v);
		return uv / (Math.sqrt(uv + squared(w)) + w);
	}
	return 0;
}

// ── Series evaluators (Karney 2013, §7) ───────────────────────────────────
// A₁(ε) − 1: scale factor for arc-length integral I₁ (eq. 17)
function A1m1f(eps: number): number {
	const p = Math.floor(ORDER / 2);
	const t = polyval(p, A1M1_COEFF, 0, squared(eps)) / A1M1_COEFF[p + 1];
	return (t + eps) / (1 - eps);
}
// C₁[l](ε): Fourier coefficients of B₁ correction (eq. 18)
function C1f(eps: number, c: Array<number>): void {
	const eps2 = squared(eps);
	let d = eps;
	let o = 0;
	for (let l = 1; l <= ORDER; l++) {
		const p = Math.floor((ORDER - l) / 2);
		c[l] = (d * polyval(p, C1_COEFF, o, eps2)) / C1_COEFF[o + p + 1];
		o += p + 2;
		d *= eps;
	}
}
// A₂(ε) − 1: scale factor for reduced-length integral I₂
function A2m1f(eps: number): number {
	const p = Math.floor(ORDER / 2);
	const t = polyval(p, A2M1_COEFF, 0, squared(eps)) / A2M1_COEFF[p + 1];
	return (t - eps) / (1 + eps);
}
// C₂[l](ε): Fourier coefficients of B₂ correction
function C2f(eps: number, c: Array<number>): void {
	const eps2 = squared(eps);
	let d = eps;
	let o = 0;
	for (let l = 1; l <= ORDER; l++) {
		const p = Math.floor((ORDER - l) / 2);
		c[l] = (d * polyval(p, C2_COEFF, o, eps2)) / C2_COEFF[o + p + 1];
		o += p + 2;
		d *= eps;
	}
}

// Precompute A₃ and C₃ series as polynomials in ε, evaluated at WGS84 n (§9)
function buildA3x(): Array<number> {
	const ax: Array<number> = new Array(ORDER);
	let o = 0;
	let k = 0;
	for (let j = ORDER - 1; j >= 0; j--) {
		const p = Math.min(ORDER - j - 1, j);
		ax[k++] = polyval(p, A3_COEFF, o, n) / A3_COEFF[o + p + 1];
		o += p + 2;
	}
	return ax;
}
function buildC3x(): Array<number> {
	const cx: Array<number> = [];
	let o = 0;
	for (let l = 1; l < ORDER; l++) {
		for (let j = ORDER - 1; j >= l; j--) {
			const p = Math.min(ORDER - j - 1, j);
			cx.push(polyval(p, C3_COEFF, o, n) / C3_COEFF[o + p + 1]);
			o += p + 2;
		}
	}
	return cx;
}
const A3x = buildA3x();
const C3x = buildC3x();

// A₃(ε): scale factor for longitude integral I₃ (eq. 24)
function A3f(eps: number): number {
	return polyval(ORDER - 1, A3x, 0, eps);
}
// C₃[l](ε): Fourier coefficients of B₃ correction (eq. 25)
function C3f(eps: number, c: Array<number>): void {
	let mult = 1;
	let o = 0;
	for (let l = 1; l < ORDER; l++) {
		const p = ORDER - l - 1;
		mult *= eps;
		c[l] = mult * polyval(p, C3x, o, eps);
		o += p + 1;
	}
}

// ── Arc-length integrals (Karney 2013, §7) ────────────────────────────────
// Returns s₁₂/b (geodesic distance scaled by b) and m₁₂/b (reduced length / b)
function geodesicLengths(
	eps: number,
	sig12: number,
	ssig1: number,
	csig1: number,
	dn1: number,
	ssig2: number,
	csig2: number,
	dn2: number,
	C1a: Array<number>,
	C2a: Array<number>,
): { s12b: number; m12b: number } {
	C1f(eps, C1a);
	C2f(eps, C2a);
	const a1 = A1m1f(eps);
	const a2 = A2m1f(eps);
	const m0x = a1 - a2;
	const A1 = 1 + a1;
	const A2 = 1 + a2;
	const B1 =
		sinCosSeries(true, ssig2, csig2, C1a) -
		sinCosSeries(true, ssig1, csig1, C1a);
	const B2 =
		sinCosSeries(true, ssig2, csig2, C2a) -
		sinCosSeries(true, ssig1, csig1, C2a);
	const J12 = m0x * sig12 + (A1 * B1 - A2 * B2);
	return {
		s12b: A1 * (sig12 + B1),
		m12b:
			dn2 * (csig1 * ssig2) - dn1 * (ssig1 * csig2) - csig1 * csig2 * J12,
	};
}

// ── Λ₁₂: longitude difference on the ellipsoid (Karney 2013, §8) ──────────
function Lambda12(
	sbet1: number,
	cbet1: number,
	dn1: number,
	sbet2: number,
	cbet2: number,
	dn2: number,
	salp1: number,
	calp1: number,
	slam12: number,
	clam12: number,
	diffp: boolean,
	C1a: Array<number>,
	C2a: Array<number>,
	C3a: Array<number>,
): {
	lam12: number;
	dlam12: number;
	salp2: number;
	calp2: number;
	sig12: number;
	ssig1: number;
	csig1: number;
	ssig2: number;
	csig2: number;
	eps: number;
} {
	// biome-ignore lint/style/noParameterAssign: breaks degeneracy of equatorial line (Karney §8)
	if (sbet1 === 0 && calp1 === 0) calp1 = -TINY;

	const salp0 = salp1 * cbet1;
	const calp0 = hypot(calp1, salp1 * sbet1);

	let ssig1 = sbet1;
	const somg1 = salp0 * sbet1;
	let csig1 = calp1 * cbet1;
	const comg1 = csig1;
	let t = hypot(ssig1, csig1);
	ssig1 /= t;
	csig1 /= t;

	const salp2 = cbet2 !== cbet1 ? salp0 / cbet2 : salp1;
	const calp2 =
		cbet2 !== cbet1 || Math.abs(sbet2) !== -sbet1
			? Math.sqrt(
					squared(calp1 * cbet1) +
						(cbet1 < -sbet1
							? (cbet2 - cbet1) * (cbet1 + cbet2)
							: (sbet1 - sbet2) * (sbet1 + sbet2)),
				) / cbet2
			: Math.abs(calp1);

	let ssig2 = sbet2;
	const somg2 = salp0 * sbet2;
	let csig2 = calp2 * cbet2;
	const comg2 = csig2;
	t = hypot(ssig2, csig2);
	ssig2 /= t;
	csig2 /= t;

	const sig12 = Math.atan2(
		Math.max(0, csig1 * ssig2 - ssig1 * csig2),
		csig1 * csig2 + ssig1 * ssig2,
	);

	const somg12 = Math.max(0, comg1 * somg2 - somg1 * comg2);
	const comg12 = comg1 * comg2 + somg1 * somg2;
	const eta = Math.atan2(
		somg12 * clam12 - comg12 * slam12,
		comg12 * clam12 + somg12 * slam12,
	);

	const k2 = squared(calp0) * ep2;
	const eps = k2 / (2 * (1 + Math.sqrt(1 + k2)) + k2);
	C3f(eps, C3a);
	const B312 =
		sinCosSeries(true, ssig2, csig2, C3a) -
		sinCosSeries(true, ssig1, csig1, C3a);
	const domg12 = -f * A3f(eps) * salp0 * (sig12 + B312);
	const lam12 = eta + domg12;

	let dlam12 = 0;
	if (diffp) {
		if (calp2 === 0) {
			dlam12 = (-2 * f1 * dn1) / sbet1;
		} else {
			const nv = geodesicLengths(
				eps,
				sig12,
				ssig1,
				csig1,
				dn1,
				ssig2,
				csig2,
				dn2,
				C1a,
				C2a,
			);
			dlam12 = (nv.m12b * f1) / (calp2 * cbet2);
		}
	}

	return {
		lam12,
		dlam12,
		salp2,
		calp2,
		sig12,
		ssig1,
		csig1,
		ssig2,
		csig2,
		eps,
	};
}

// ── Initial azimuth estimate for Newton's method (Karney 2013, §8) ─────────
function inverseStart(
	sbet1: number,
	cbet1: number,
	_dn1: number,
	sbet2: number,
	cbet2: number,
	_dn2: number,
	lam12: number,
	slam12: number,
	clam12: number,
	_C1a: Array<number>,
	_C2a: Array<number>,
): {
	sig12: number;
	salp1: number;
	calp1: number;
	salp2: number;
	calp2: number;
	dnm: number;
} {
	const sbet12 = sbet2 * cbet1 - cbet2 * sbet1;
	const cbet12 = cbet2 * cbet1 + sbet2 * sbet1;
	const sbet12a = sbet2 * cbet1 + cbet2 * sbet1;

	const shortline = cbet12 >= 0 && sbet12 < 0.5 && cbet2 * lam12 < 0.5;
	let somg12: number;
	let comg12: number;
	let dnm = 1;

	if (shortline) {
		const sbetm2 =
			squared(sbet1 + sbet2) /
			(squared(sbet1 + sbet2) + squared(cbet1 + cbet2));
		dnm = Math.sqrt(1 + ep2 * sbetm2);
		const omg12 = lam12 / (f1 * dnm);
		somg12 = Math.sin(omg12);
		comg12 = Math.cos(omg12);
	} else {
		somg12 = slam12;
		comg12 = clam12;
	}

	let salp1 = cbet2 * somg12;
	let calp1 =
		comg12 >= 0
			? sbet12 + (cbet2 * sbet1 * squared(somg12)) / (1 + comg12)
			: sbet12a - (cbet2 * sbet1 * squared(somg12)) / (1 - comg12);

	const ssig12 = hypot(salp1, calp1);
	const csig12 = sbet1 * sbet2 + cbet1 * cbet2 * comg12;

	let salp2 = 0;
	let calp2 = 0;
	let sig12 = -1;

	if (shortline && ssig12 < ETOL2) {
		salp2 = cbet1 * somg12;
		calp2 =
			sbet12 -
			cbet1 *
				sbet2 *
				(comg12 >= 0 ? squared(somg12) / (1 + comg12) : 1 - comg12);
		const nt = hypot(salp2, calp2);
		salp2 /= nt;
		calp2 /= nt;
		sig12 = Math.atan2(ssig12, csig12);
	} else if (
		Math.abs(n) > 0.1 ||
		csig12 >= 0 ||
		ssig12 >= 6 * Math.abs(n) * Math.PI * squared(cbet1)
	) {
		// spherical approximation is good enough
	} else {
		const lam12x = Math.atan2(-slam12, -clam12);

		// Prolate ellipsoid (f < 0) — unreachable while f is a WGS84 constant
		// (f = 1/EARTH_FLATTENING ≈ +1/298.257 > 0). Restore and test this
		// block if f is ever made a parameter or the ellipsoid is generalised.
		// Restoring the prolate else branch would require changing these to let.
		// if (f >= 0) {
		const k2 = squared(sbet1) * ep2;
		const eps = k2 / (2 * (1 + Math.sqrt(1 + k2)) + k2);
		const lamscale = f * cbet1 * A3f(eps) * Math.PI;
		const betscale = lamscale * cbet1;
		const x = lam12x / lamscale;
		const y = sbet12a / betscale;
		// } else {
		//	const cbet12a = cbet2 * cbet1 - sbet2 * sbet1;
		//	const bet12a  = Math.atan2(sbet12a, cbet12a);
		//	const nv      = geodesicLengths(n, Math.PI + bet12a, sbet1, -cbet1,
		//	                                _dn1, sbet2, cbet2, _dn2, _C1a, _C2a);
		//	const m12b    = nv.m12b;
		//	const m0      = A1m1f(n) - A2m1f(n);
		//	x             = -1 + m12b / (cbet1 * cbet2 * m0 * Math.PI);
		//	betscale      = x < -0.01 ? sbet12a / x : -f * squared(cbet1) * Math.PI;
		//	lamscale      = betscale / cbet1;
		//	y             = lam12 / lamscale;
		// }

		if (y > -TOL1 && x > -1 - XTHRESH) {
			// Prolate ellipsoid (f < 0) — unreachable for WGS84; see note above.
			// if (f < 0) {
			//	calp1 = Math.max(x > -TOL1 ? 0 : -1, x);
			//	salp1 = Math.sqrt(1 - squared(calp1));
			// } else {
			salp1 = Math.min(1, -x);
			calp1 = -Math.sqrt(1 - squared(salp1));
			// }
		} else {
			const k = astroid(x, y);
			// Prolate ellipsoid (f < 0) uses (-y * (1 + k)) / k — unreachable for WGS84.
			const omg12a = lamscale * ((-x * k) / (1 + k));
			somg12 = Math.sin(omg12a);
			comg12 = -Math.cos(omg12a);
			salp1 = cbet2 * somg12;
			calp1 = sbet12a - (cbet2 * sbet1 * squared(somg12)) / (1 - comg12);
		}
	}

	if (!(salp1 <= 0)) {
		const nt = hypot(salp1, calp1);
		salp1 /= nt;
		calp1 /= nt;
	} else {
		salp1 = 1;
		calp1 = 0;
	}

	return { sig12, salp1, calp1, salp2, calp2, dnm };
}

// ── Inverse geodesic distance (Karney 2013, §8) ───────────────────────────
function inverseDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	let φ1 = Math.max(-90, Math.min(90, lat1));
	let φ2 = Math.max(-90, Math.min(90, lat2));

	// Normalise longitude difference to [0, 180]
	let lon12 = angNormalize(angNormalize(lon2) - angNormalize(lon1));
	const lonsign = lon12 >= 0 ? 1 : -1;
	lon12 = lonsign * lon12;
	const slam12 = lon12 === 180 ? 0 : Math.sin(lon12 * D2R);
	const clam12 = Math.cos(lon12 * D2R);

	// Canonical form: |lat1| ≥ |lat2|, lat1 ≤ 0
	const swapp = Math.abs(φ1) >= Math.abs(φ2) ? 1 : -1;
	if (swapp < 0) [φ2, φ1] = [φ1, φ2];
	const latsign = φ1 <= 0 ? 1 : -1;
	φ1 *= latsign;
	φ2 *= latsign;

	// Parametric latitudes: tan β = (1−f) tan φ
	let sbet1 = f1 * Math.sin(φ1 * D2R);
	let cbet1 = Math.cos(φ1 * D2R);
	let t = hypot(sbet1, cbet1);
	sbet1 /= t;
	cbet1 /= t;
	cbet1 = Math.max(TINY, cbet1);

	let sbet2 = f1 * Math.sin(φ2 * D2R);
	let cbet2 = Math.cos(φ2 * D2R);
	t = hypot(sbet2, cbet2);
	sbet2 /= t;
	cbet2 /= t;
	cbet2 = Math.max(TINY, cbet2);

	// Enforce exact symmetry for antipodal/coincident pole cases
	if (cbet1 < -sbet1) {
		if (cbet2 === cbet1) sbet2 = copysign(sbet1, sbet2);
	} else {
		if (Math.abs(sbet2) === -sbet1) cbet2 = cbet1;
	}

	const dn1 = Math.sqrt(1 + ep2 * squared(sbet1));
	const dn2 = Math.sqrt(1 + ep2 * squared(sbet2));

	const lam12 = lon12 * D2R;
	const C1a = new Array(ORDER + 1);
	const C2a = new Array(ORDER + 1);
	const C3a = new Array(ORDER);

	let s12b: number;
	let calp1: number;
	let salp1: number;
	let calp2: number;
	let ssig1: number;
	let csig1: number;
	let ssig2: number;
	let csig2: number;
	let eps: number;

	const meridian = φ1 === -90 || slam12 === 0;

	if (meridian) {
		calp1 = clam12;
		salp1 = slam12;
		calp2 = 1;
		ssig1 = sbet1;
		csig1 = calp1 * cbet1;
		ssig2 = sbet2;
		csig2 = calp2 * cbet2;
		const sig12m = Math.atan2(
			Math.max(0, csig1 * ssig2 - ssig1 * csig2),
			csig1 * csig2 + ssig1 * ssig2,
		);
		// For a meridional geodesic calp₀ = 1, so ε → n (third flattening).
		// GeographicLib evaluates geodesicLengths at n directly for this branch.
		eps = n;
		const nv = geodesicLengths(
			eps,
			sig12m,
			ssig1,
			csig1,
			dn1,
			ssig2,
			csig2,
			dn2,
			C1a,
			C2a,
		);
		s12b = nv.s12b;
		if (sig12m < 3 * TINY || (sig12m < TOL0 && (s12b < 0 || nv.m12b < 0))) {
			s12b = 0;
		}
		return b * s12b;
	}

	// Equatorial geodesic — only valid when the supplementary longitude
	// (180° − lon12) ≥ f·180°; near-antipodal equatorial pairs fall through
	// to Newton's method, which finds the shorter off-equator geodesic.
	if (sbet1 === 0 && (f <= 0 || 180 - lon12 >= f * 180)) {
		return a * lam12;
	}

	// General case: Newton's method on Λ₁₂(α₁) = lam12 (§8)
	const ns = inverseStart(
		sbet1,
		cbet1,
		dn1,
		sbet2,
		cbet2,
		dn2,
		lam12,
		slam12,
		clam12,
		C1a,
		C2a,
	);
	let sig12 = ns.sig12;
	salp1 = ns.salp1;
	calp1 = ns.calp1;

	if (sig12 >= 0) {
		calp2 = ns.calp2;
		s12b = sig12 * b * ns.dnm;
		return s12b;
	}

	calp2 = 0;
	ssig1 = 0;
	csig1 = 0;
	ssig2 = 0;
	csig2 = 0;
	eps = 0;

	let salp1a = TINY;
	let calp1a = 1;
	let salp1b = TINY;
	let calp1b = -1;
	let tripn = false;
	let tripb = false;

	for (let numit = 0; ; ++numit) {
		const lv = Lambda12(
			sbet1,
			cbet1,
			dn1,
			sbet2,
			cbet2,
			dn2,
			salp1,
			calp1,
			slam12,
			clam12,
			numit < MAXIT1,
			C1a,
			C2a,
			C3a,
		);
		const v = lv.lam12;
		calp2 = lv.calp2;
		sig12 = lv.sig12;
		ssig1 = lv.ssig1;
		csig1 = lv.csig1;
		ssig2 = lv.ssig2;
		csig2 = lv.csig2;
		eps = lv.eps;
		const dv = lv.dlam12;

		if (
			tripb ||
			!(Math.abs(v) >= (tripn ? 8 : 1) * TOL0) ||
			numit === MAXIT2
		)
			break;

		if (v > 0 && (numit < MAXIT1 || calp1 / salp1 > calp1b / salp1b)) {
			salp1b = salp1;
			calp1b = calp1;
		} else if (
			v < 0 &&
			(numit < MAXIT1 || calp1 / salp1 < calp1a / salp1a)
		) {
			salp1a = salp1;
			calp1a = calp1;
		}

		if (numit < MAXIT1 && dv > 0) {
			const dalp1 = -v / dv;
			if (Math.abs(dalp1) < Math.PI) {
				const sdalp1 = Math.sin(dalp1);
				const cdalp1 = Math.cos(dalp1);
				const nsalp1 = salp1 * cdalp1 + calp1 * sdalp1;
				if (nsalp1 > 0) {
					calp1 = calp1 * cdalp1 - salp1 * sdalp1;
					salp1 = nsalp1;
					t = hypot(salp1, calp1);
					salp1 /= t;
					calp1 /= t;
					tripn = Math.abs(v) <= 16 * TOL0;
					continue;
				}
			}
		}
		salp1 = (salp1a + salp1b) / 2;
		calp1 = (calp1a + calp1b) / 2;
		t = hypot(salp1, calp1);
		salp1 /= t;
		calp1 /= t;
		tripn = false;
		tripb =
			Math.abs(salp1a - salp1) + (calp1a - calp1) < TOLB ||
			Math.abs(salp1 - salp1b) + (calp1 - calp1b) < TOLB;
	}

	const nv = geodesicLengths(
		eps,
		sig12,
		ssig1,
		csig1,
		dn1,
		ssig2,
		csig2,
		dn2,
		C1a,
		C2a,
	);
	return b * nv.s12b;
}

// ── Public interface ───────────────────────────────────────────────────────
export function karney(
	[lon1, lat1]: [number, number],
	[lon2, lat2]: [number, number],
): number {
	return inverseDistance(lat1, lon1, lat2, lon2);
}
