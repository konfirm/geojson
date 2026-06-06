import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import { explain, type Improbability } from '../../../test/helper/spec';
import {
	getClosestPointOnLineByPoint,
	getDistanceOfLineToLine,
	getDistanceOfPointToLine,
	getDistanceOfPointToPoint,
	isLinesCrossing,
	isPointInRing,
	isPointOnLine,
} from './Calculate';

describe('Domain/Utility/Calculate', () => {
	describe('getDistanceOfPointToPoint', () => {
		test('known coordinate pairs across formulas', () => {
			each`
				a                                         | b                                         | cartesian              | haversine                    | vincenty             | karney
				------------------------------------------|-------------------------------------------|------------------------|------------------------------|----------------------|---
				${[0, 0]}                                 | ${[1, 0]}                                 |   111195.07973436874   |   111195.07973436874         |   111319.49079322325 |   111319.49079327357
				${[0, 0]}                                 | ${[0, 1]}                                 |   111195.07973436874   |   111195.07973436874         |   110574.38855795695 |   110574.38855779878
				${[0, 0]}                                 | ${[1, 1]}                                 |   157253.589829502     |   157249.5977681334          |   156899.56829129544 |   156899.56829134029
				${[0, 0]}                                 | ${[2, 1]}                                 |   248639.75704955778   |   248629.6571521291          |   248575.56516788687 |   248575.56516798114
				${[0, 0]}                                 | ${[1, 2]}                                 |   248639.75704955778   |   248629.6571521291          |   247576.47264770948 |   247576.47264764848
				${[0, 0]}                                 | ${[2, 2]}                                 |   314507.179659004     |   314475.23806026357         |   313775.70942909684 |   313775.7094291842
				${[9, 9]}                                 | ${[1, 9]}                                 |   889560.63787495      |   878591.1714926899          |   879646.2426697082  |   879646.2426687861
				${[5.911760330200195, 51.97496770044958]} | ${[5.900301933288574, 51.97938231105512]} |     1365.4087816000642 |      925.6976780365701       |      927.9989469343577 |      927.998948321103
				${[4.8422, 45.7597]}                      | ${[2.3508, 48.8567]}                      |   441970.48063825216   |   392217.2577987035          |   392431.52894877724 |   392431.5289491997
				${[-180, -90]}                            | ${[180, 90]}                              | 44755156.2689204       | 20015114.352186374           | 20003931.4586233     | 20003931.458625443
				${[-180, 90]}                             | ${[180, -90]}                             | 44755156.2689204       | 20015114.352186374           | 20003931.4586233     | 20003931.458625443
				${[-180, 0]}                              | ${[180, 0]}                               | 40030228.70437275      |        1.5604470998469443e-9 | 20003931.4586233     |        0
			`(({ a, b, ...calc }: Improbability) => {
				for (const key of Object.keys(calc)) {
					const value = Number(calc[key]);
					assert.strictEqual(
						getDistanceOfPointToPoint(a, b, key as Improbability),
						value,
						`${key} distance from ${explain(a)} to ${explain(b)} is ${value}`,
					);
				}
			});
		});

		test('accepts a custom function', () => {
			assert.strictEqual(
				getDistanceOfPointToPoint([0, 0], [0, 0], () => Math.PI),
				Math.PI,
			);
		});

		test('vincenty throws for near-antipodal points', () => {
			// Wikipedia "Vincenty's formulae § Nearly antipodal points":
			// (0°,0°)→(0.5°,179.7°) fails to converge; correct answer 19944127.421 m
			each`
				a         | b
				----------|---
				${[0, 0]} | ${[179.7, 0.5]}
				${[0, 0]} | ${[179.9, 0.1]}
			`(({ a, b }: Improbability) => {
				assert.throws(
					() => getDistanceOfPointToPoint(a, b, 'vincenty'),
					/Vincenty formula failed to converge/,
				);
			});
		});

		test('vincenty converges slowly for (0°,0°)→(0.5°,179.5°)', () => {
			// Wikipedia "Vincenty's formulae § Nearly antipodal points":
			// (0°,0°)→(0.5°,179.5°) requires ~130 iterations but converges; stated answer 19936288.579 m
			assert.strictEqual(
				getDistanceOfPointToPoint([0, 0], [179.5, 0.5], 'vincenty'),
				19936288.578980867,
			);
		});

		test('karney converges for near-antipodal points', () => {
			// Wikipedia "Vincenty's formulae § Nearly antipodal points" gives
			// the correct answers that Vincenty fails to compute:
			// (0°,0°)→(0.5°,179.5°) correct: 19936288.579 m  (slow but converges in vincenty too)
			// (0°,0°)→(0.5°,179.7°) correct: 19944127.421 m  (vincenty diverges)
			each`
				a         | b               | karney
				----------|-----------------|---
				${[0, 0]} | ${[179.5, 0.5]} | 19936288.578965314
				${[0, 0]} | ${[179.7, 0.5]} | 19944127.420750458
				${[0, 0]} | ${[179.9, 0.1]} | 19992082.10791384
			`(({ a, b, karney: expected }: Improbability) => {
				assert.strictEqual(
					getDistanceOfPointToPoint(a, b, 'karney'),
					Number(expected),
					`karney distance from ${explain(a)} to ${explain(b)} is ${expected}`,
				);
			});
		});

		test('throws for unknown formula', () => {
			assert.throws(
				() =>
					getDistanceOfPointToPoint(
						[0, 0],
						[1, 1],
						<Improbability>'unknown',
					),
				/Not a PointToPoint calculation function unknown/,
			);
		});
	});

	describe('getDistanceOfPointToLine', () => {
		const line = [
			[5.911760330200195, 51.97496770044958],
			[5.900301933288574, 51.97938231105512],
		];

		test('known point-to-line distances across formulas', () => {
			each`
				point                                      | line                | cartesian             | haversine             | vincenty
				-------------------------------------------|---------------------|-----------------------|-----------------------|---
				${[1, 1]}                                  | ${[[0, 0], [3, 3]]} |      0                |      0                |      0
				${[2, 1]}                                  | ${[[0, 0], [3, 3]]} |  78626.794914751      |  78617.31500879859    |  78442.46603900737
				${[1, 2]}                                  | ${[[0, 0], [3, 3]]} |  78626.794914751      |  78608.33580070207    |  78433.68568647826
				${[5, 2]}                                  | ${[[0, 0], [9, 0]]} | 222390.1594687375     | 222390.1594687375     | 221149.45337244959
				${[5, 2]}                                  | ${[[0, 0], [0, 9]]} | 555975.3986718437     | 555636.4985775814     | 556260.4424545396
				${[1, 1]}                                  | ${[[0, 0], [9, 0]]} | 111195.07973436874    | 111195.07973436874    | 110574.38855795695
				${[3, 1]}                                  | ${[[0, 0], [9, 0]]} | 111195.07973436874    | 111195.07973436874    | 110574.38855795695
				${[5, 1]}                                  | ${[[0, 0], [9, 0]]} | 111195.07973436874    | 111195.07973436874    | 110574.38855795695
				${[7, 1]}                                  | ${[[0, 0], [9, 0]]} | 111195.07973436874    | 111195.07973436874    | 110574.38855795695
				${[5.909668207168579, 51.979065108032444]} | ${line}             |    341.51430750144857 |    327.53158580286527 |    327.7879564857677
			`(({ point, line, ...calc }: Improbability) => {
				for (const key of Object.keys(calc)) {
					const value = Number(calc[key]);
					assert.strictEqual(
						getDistanceOfPointToLine(
							point,
							line,
							key as Improbability,
						),
						value,
						`${key} distance from ${explain(point)} to ${explain(line)} is ${value}`,
					);
				}
			});
		});

		test('accepts a custom function', () => {
			assert.strictEqual(
				getDistanceOfPointToLine(
					[0, 0],
					[
						[0, 0],
						[1, 1],
					],
					() => Math.PI,
				),
				Math.PI,
			);
		});

		test('throws for unknown formula', () => {
			assert.throws(
				() =>
					getDistanceOfPointToLine(
						[0, 0],
						[
							[0, 0],
							[1, 1],
						],
						<Improbability>'unknown',
					),
				/Not a PointToPoint calculation function unknown/,
			);
		});
	});

	describe('getDistanceOfLineToLine', () => {
		test('known line-to-line distances across formulas', () => {
			each`
				a                    | b                    | cartesian          | haversine          | vincenty
				---------------------|----------------------|--------------------|--------------------|---
				${[[1, 1], [2, 2]]}  | ${[[0, 0], [3, 3]]}  |      0             |      0             |      0
				${[[1, 1], [20, 2]]} | ${[[0, 0], [30, 2]]} |  73965.86679042356 |  73965.72628462575 |  73555.60559277069
				${[[2, 2], [4, 2]]}  | ${[[1, 1], [5, 1]]}  | 111195.07973436874 | 111195.07973436874 | 110575.06481449273
				${[[2, 2], [4, 2]]}  | ${[[1, 1], [1, 5]]}  | 111195.07973436874 | 111127.34097821356 | 111252.1298001606
				${[[2, 2], [4, 2]]}  | ${[[1, 1], [5, 5]]}  |      0             |      0             |      0
				${[[0, 0], [2, 0]]}  | ${[[1, 1], [1, 3]]}  | 111195.07973436874 | 111195.07973436874 | 110574.38855795695
				${[[0, 0], [0, 5]]}  | ${[[3, 3], [9, 3]]}  | 333585.23920310626 | 333127.967966738   | 333503.7471426487
			`(({ a, b, ...calc }: Improbability) => {
				for (const key of Object.keys(calc)) {
					const value = Number(calc[key]);
					assert.strictEqual(
						getDistanceOfLineToLine(a, b, key as Improbability),
						value,
						`${key} distance from ${explain(a)} to ${explain(b)} is ${value}`,
					);
				}
			});
		});

		test('accepts a custom function', () => {
			assert.strictEqual(
				getDistanceOfLineToLine(
					[
						[0, 0],
						[1, 1],
					],
					[
						[0, 0],
						[1, 1],
					],
					() => Math.PI,
				),
				Math.PI,
			);
		});

		test('throws for unknown formula', () => {
			assert.throws(
				() =>
					getDistanceOfLineToLine(
						[
							[0, 0],
							[0, 1],
						],
						[
							[1, 0],
							[1, 1],
						],
						<Improbability>'unknown',
					),
				/Not a PointToPoint calculation function unknown/,
			);
		});
	});

	describe('getClosestPointOnLineByPoint', () => {
		test('finds closest point on line', () => {
			each`
				point                                      | line                                                                                | closest
				-------------------------------------------|-------------------------------------------------------------------------------------|---
				${[1, 1]}                                  | ${[[0, 0], [3, 3]]}                                                                 | ${[1, 1]}
				${[2, 1]}                                  | ${[[0, 0], [3, 3]]}                                                                 | ${[1.5, 1.5]}
				${[1, 2]}                                  | ${[[0, 0], [3, 3]]}                                                                 | ${[1.5, 1.5]}
				${[5, 2]}                                  | ${[[0, 0], [9, 0]]}                                                                 | ${[5, 0]}
				${[5, 2]}                                  | ${[[0, 0], [0, 9]]}                                                                 | ${[0, 2]}
				${[5.909668207168579, 51.979065108032444]} | ${[[5.911760330200195, 51.97496770044958], [5.900301933288574, 51.97938231105512]]} | ${[5.9085640303798, 51.97619914837327]}
			`(({ point, line, closest }: Improbability) => {
				assert.deepStrictEqual(
					getClosestPointOnLineByPoint(point, line),
					closest,
					`${explain(point)} to ${explain(line)} closest is ${explain(closest)}`,
				);
			});
		});
	});

	describe('isLinesCrossing', () => {
		test('returns true for crossing lines', () => {
			each`
				a                      | b
				-----------------------|---
				${[[0, 0], [2, 2]]}    | ${[[0, 1], [2, 1]]}
				${[[0, 1], [9, 2]]}    | ${[[0, 2], [9, 1]]}
			`(({ a, b }: Improbability) => {
				assert.ok(
					isLinesCrossing(a, b),
					`${explain(a)} crosses ${explain(b)}`,
				);
			});
		});

		test('returns false for non-crossing lines', () => {
			each`
				a                      | b
				-----------------------|---
				${[[0, 1], [9, 2]]}    | ${[[0, 2], [9, 3]]}
				${[[0, 1], [1000, 2]]} | ${[[0, 2], [1000, 3]]}
			`(({ a, b }: Improbability) => {
				assert.ok(
					!isLinesCrossing(a, b),
					`${explain(a)} does not cross ${explain(b)}`,
				);
			});
		});
	});

	describe('isPointOnLine', () => {
		test('returns true for points on the line', () => {
			each`
				point                                     | line
				------------------------------------------|---
				${[1, 1]}                                 | ${[[0, 0], [3, 3]]}
				${[5.906031131744385, 51.97717500575235]} | ${[[5.911760330200195, 51.97496770044958], [5.900301933288574, 51.97938231105512]]}
			`(({ point, line }: Improbability) => {
				assert.ok(
					isPointOnLine(point, line),
					`${explain(point)} is on ${explain(line)}`,
				);
			});
		});

		test('returns false for points not on the line', () => {
			each`
				point                                     | line
				------------------------------------------|---
				${[2, 1]}                                 | ${[[0, 0], [3, 3]]}
				${[1, 2]}                                 | ${[[0, 0], [3, 3]]}
				${[5, 2]}                                 | ${[[0, 0], [9, 0]]}
				${[5, 2]}                                 | ${[[0, 0], [0, 9]]}
				${[5.909668207168579, 51.979065108032444]}| ${[[5.911760330200195, 51.97496770044958], [5.900301933288574, 51.97938231105512]]}
			`(({ point, line }: Improbability) => {
				assert.ok(
					!isPointOnLine(point, line),
					`${explain(point)} is not on ${explain(line)}`,
				);
			});
		});
	});

	describe('isPointInRing', () => {
		test('returns true for points inside or on the ring', () => {
			each`
				point     | ring
				----------|---
				${[0, 0]} | ${[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]}
				${[2, 2]} | ${[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]}
				${[1, 1]} | ${[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]}
				${[1, 1]} | ${[[1, 0], [0, 1], [1, 2], [2, 1], [1, 0]]}
			`(({ point, ring }: Improbability) => {
				assert.ok(
					isPointInRing(point, ring),
					`${explain(point)} is inside ${explain(ring)}`,
				);
			});
		});

		test('returns false for points outside the ring', () => {
			each`
				point     | ring
				----------|---
				${[3, 1]} | ${[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]}
				${[1, 3]} | ${[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]}
				${[0, 0]} | ${[[1, 0], [0, 1], [1, 2], [2, 1], [1, 0]]}
				${[2, 2]} | ${[[1, 0], [0, 1], [1, 2], [2, 1], [1, 0]]}
			`(({ point, ring }: Improbability) => {
				assert.ok(
					!isPointInRing(point, ring),
					`${explain(point)} is not inside ${explain(ring)}`,
				);
			});
		});
	});
});
