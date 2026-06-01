import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import { explain, type Improbability } from '../../../test/helper/spec';
import { karney } from './Geodesic';

describe('Domain/Utility/Geodesic', () => {
	describe('karney', () => {
		// GeographicLib reference cases
		// Extracted from GeographicLib/geodesic/test/geodesictest.js (MIT).
		// Each case: a=[lon,lat], b=[lon,lat], s12=distance in metres.
		// All deltas vs. geodesictest reference are < 5 nm.
		test('matches GeographicLib geodesictest cases', () => {
			each`
				a                          | b                          | s12
				---------------------------|----------------------------|---
				${[-139.44815, 35.60777]}  | ${[-69.95921, -11.17491]}  |  8935244.560481828
				${[106.05087, 55.52454]}   | ${[197.18234, 77.03196]}   |  4105086.171392443
				${[142.59065, -21.97856]}  | ${[98.56635, 41.84138]}    |  8394328.89465767
				${[112.2363, -66.99028]}   | ${[285.90344, -12.70631]}  | 11150344.231208025
				${[173.34268, -17.42761]}  | ${[5.93557, -15.84784]}    | 16076603.163118068
				${[48.28919, 32.84994]}    | ${[202.29132, -56.28556]}  | 16727068.943816446
				${[52.74123, 6.96833]}     | ${[206.17291, -7.39675]}   | 17102477.249695837
				${[-16.30485, -50.56724]}  | ${[-94.97412, -33.56571]}  |  6455670.511866871
				${[-8.90775, -58.93002]}   | ${[133.13503, -8.91104]}   | 11756066.021986464
				${[-74.28391, -68.82867]}  | ${[-8.36685, -50.63005]}   |  3956936.9260635437
				${[-32.0898, -10.62672]}   | ${[-134.31681, 5.883]}     | 11470869.386456301
				${[166.90563, -21.76221]}  | ${[213.97627, 48.72884]}   |  9098627.398655491
				${[-174.47484, -19.79938]} | ${[-154.35109, -11.99349]} |  2319004.860116939
				${[-116.94513, -11.95887]} | ${[7.16501, 4.57352]}      | 13834722.580140138
				${[85.66836, -87.85331]}   | ${[16.09921, 66.48646]}    | 17286615.31471446
				${[128.32011, 1.74708]}    | ${[11.87109, -11.16617]}   | 12942901.12413474
				${[-144.90758, -25.72959]} | ${[-269.17879, -57.70581]} |  9413446.745245311
				${[122.32875, -41.22777]}  | ${[130.37946, -7.57291]}   |  3812686.0351060205
				${[138.25278, 11.01307]}   | ${[247.05981, 6.62726]}    | 11911190.819018407
				${[95.14681, -29.47124]}   | ${[-69.15955, -27.46601]}  | 13487015.838114547
			`(({ a, b, s12 }: Improbability) => {
				assert.strictEqual(
					karney(a, b),
					Number(s12),
					`karney(${explain(a)}, ${explain(b)}) = ${s12}`,
				);
			});
		});

		// Coincident points
		test('coincident points return 0', () => {
			assert.strictEqual(karney([0, 0], [0, 0]), 0);
			assert.strictEqual(karney([45, 60], [45, 60]), 0);
			assert.strictEqual(karney([0, 90], [0, 90]), 0);
		});

		// Meridional branch (slam12 = 0 or lat = ±90)
		// Exercises the meridian fast path in inverseDistance.
		test('meridional and polar geodesics', () => {
			each`
				a           | b           | s12
				------------|-------------|---
				${[0, 0]}   | ${[0, 90]}  | 10001965.729312722
				${[0, 0]}   | ${[0, -90]} | 10001965.729312722
				${[0, 90]}  | ${[0, -90]} | 20003931.458625443
				${[90, 90]} | ${[90, -90]}| 20003931.458625443
				${[0, 90]}  | ${[0, 0]}   | 10001965.729312722
				${[0, 0]}   | ${[45, -90]}| 10001965.729312724
			`(({ a, b, s12 }: Improbability) => {
				assert.strictEqual(
					karney(a, b),
					Number(s12),
					`karney(${explain(a)}, ${explain(b)}) = ${s12}`,
				);
			});
		});

		// Equatorial branch (both on equator, lon12 ≤ ~179.4°)
		// Exercises the equatorial fast path; a·Λ₁₂ formula.
		test('equatorial geodesics', () => {
			each`
				a         | b           | s12
				----------|-------------|---
				${[0, 0]} | ${[90, 0]}  | 10018754.171394622
				${[0, 0]} | ${[170, 0]} | 18924313.434856508
			`(({ a, b, s12 }: Improbability) => {
				assert.strictEqual(
					karney(a, b),
					Number(s12),
					`karney(${explain(a)}, ${explain(b)}) = ${s12}`,
				);
			});
		});

		// Near-antipodal and equatorial-antipodal
		// Exercises Newton's method with astroid initial estimate.
		// These are the cases that defeat Vincenty; correct answers from
		// GeographicLib and Wikipedia "Vincenty's formulae § Nearly antipodal".
		test('near-antipodal and equatorial-antipodal geodesics', () => {
			each`
				a           | b                | s12
				------------|------------------|---
				${[0, 0]}   | ${[180, 0]}      | 20003931.458625447
				${[0, 0]}   | ${[179.5, 0]}    | 19980861.908890963
				${[0, 0]}   | ${[179.5, 0.5]}  | 19936288.578965314
				${[0, 0]}   | ${[179.7, 0.5]}  | 19944127.420750458
				${[0, 30]}  | ${[180, -30]}    | 20003931.458625447
				${[10, 10]} | ${[-170, -10]}   | 20003931.458625447
			`(({ a, b, s12 }: Improbability) => {
				assert.strictEqual(
					karney(a, b),
					Number(s12),
					`karney(${explain(a)}, ${explain(b)}) = ${s12}`,
				);
			});
		});

		// Sub-millimetre pairs — shortline ETOL2 early-return
		// GeodTest.dat "short" category (lines 152003, 154065, 154108).
		// Points are so close that the spherical arc estimate is below ETOL2,
		// allowing inverseStart to return a direct solution without Newton.
		test('sub-millimetre shortline geodesics', () => {
			each`
				a                       | b                                                | s12
				------------------------|--------------------------------------------------|---
				${[0, 35.36284833173]}  | ${[0.000000008643945765, 35.36284832650836718]}  | 0.0009760999388442188
				${[0, 3.215026142987]}  | ${[0.000000139248411094, 3.215027707832632004]}  | 0.1737278999695807
				${[0, 83.608913171018]} | ${[0.000007497125466434, 83.608914297840643495]} | 0.15660299933829128
			`(({ a, b, s12 }: Improbability) => {
				assert.strictEqual(
					karney(a, b),
					Number(s12),
					`karney(${explain(a)}, ${explain(b)}) = ${s12}`,
				);
			});
		});

		// Near-polar near-antipodal — Newton bisection fallback
		// GeodTest.dat "random" category (lines 303142, 303569, 304495).
		// These high-latitude pairs near lon_diff≈180° force the Newton step to
		// overshoot (salp1 would go negative), triggering the bisection guard.
		test('near-polar near-antipodal geodesics requiring bisection', () => {
			each`
				a                       | b                                                  | s12
				------------------------|----------------------------------------------------|---
				${[0, 82.045147306931]} | ${[179.990397020004304062, 82.259087015856617131]} | 1753012.0559770009
				${[0, 81.118123796511]} | ${[179.996524523392402377, 81.4357486029206472]}   | 1948475.7898285992
				${[0, 84.67513518516]}  | ${[179.996666572278828686, 85.327242437153170179]} | 1116645.2674368003
			`(({ a, b, s12 }: Improbability) => {
				assert.strictEqual(
					karney(a, b),
					Number(s12),
					`karney(${explain(a)}, ${explain(b)}) = ${s12}`,
				);
			});
		});

		// General Newton's method
		test('general geodesics', () => {
			each`
				a                                         | b                                         | s12
				------------------------------------------|-------------------------------------------|---
				${[5.911760330200195, 51.97496770044958]} | ${[5.900301933288574, 51.97938231105512]} |      927.998948321103
				${[4.8422, 45.7597]}                      | ${[2.3508, 48.8567]}                      | 392431.5289491997
				${[170, 0]}                               | ${[-170, 0]}                              | 2226389.8158654715
			`(({ a, b, s12 }: Improbability) => {
				assert.strictEqual(
					karney(a, b),
					Number(s12),
					`karney(${explain(a)}, ${explain(b)}) = ${s12}`,
				);
			});
		});
	});
});
