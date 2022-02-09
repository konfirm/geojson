import test from 'tape';
import each from 'template-literal-each';
import * as Calculate from '../../../source/Domain/Utility/Calculate';
import { explain } from '../../helper/geometry';

test('Domain/Utility/Calculate - exports', (t) => {
    const expected = [
        'getDistanceOfPointToPoint',
        'getClosestPointOnLineByPoint',
        'isLinesCrossing',
        'getDistanceOfPointToLine',
        'getDistanceOfLineToLine',
        'isPointOnLine',
        'isPointInRing',
    ];
    const actual = Object.keys(Calculate);

    t.deepEqual(actual, expected, `exports ${expected.join(', ')}`);
    expected.forEach((key) => t.equal(typeof Calculate[key], 'function', `${key} is a function`))

    t.end();
});

test('Domain/Utility/Calculate - getDistanceOfPointToPoint', (t) => {
    const { getDistanceOfPointToPoint } = Calculate;

    each`
        a                                         | b                                         | distance
        ------------------------------------------|-------------------------------------------|----------
        ${[0, 0]}                                 | ${[1, 0]}                                 | 1
        ${[0, 0]}                                 | ${[0, 1]}                                 | 1
        ${[0, 0]}                                 | ${[1, 1]}                                 | 1.4142135623730951
        ${[0, 0]}                                 | ${[2, 1]}                                 | 2.23606797749979
        ${[0, 0]}                                 | ${[1, 2]}                                 | 2.23606797749979
        ${[0, 0]}                                 | ${[2, 2]}                                 | 2.8284271247461903
        ${[9, 9]}                                 | ${[1, 9]}                                 | 8
        ${[5.911760330200195, 51.97496770044958]} | ${[5.900301933288574, 51.97938231105512]} | 0.012279399276135748
    `(({ a, b, distance }: any) => {
        t.equal(getDistanceOfPointToPoint(a, b), Number(distance), `${explain(a)} to ${explain(b)} is ${distance}`);
    });

    t.end();
});

test('Domain/Utility/Calculate - getClosestPointOnLineByPoint', (t) => {
    const { getClosestPointOnLineByPoint } = Calculate;

    each`
        point                                      | line                                                                                | closest
        -------------------------------------------|-------------------------------------------------------------------------------------|---------
        ${[1, 1]}                                  | ${[[0, 0], [3, 3]]}                                                                 | ${[1, 1]}
        ${[2, 1]}                                  | ${[[0, 0], [3, 3]]}                                                                 | ${[1.5, 1.5]}
        ${[1, 2]}                                  | ${[[0, 0], [3, 3]]}                                                                 | ${[1.5, 1.5]}
        ${[5, 2]}                                  | ${[[0, 0], [9, 0]]}                                                                 | ${[5, 0]}
        ${[5, 2]}                                  | ${[[0, 0], [0, 9]]}                                                                 | ${[0, 2]}
        ${[5.909668207168579, 51.979065108032444]} | ${[[5.911760330200195, 51.97496770044958], [5.900301933288574, 51.97938231105512]]} | ${[5.9085640303798, 51.97619914837327]}
    `(({ point, line, closest }: any) => {
        t.deepEqual(getClosestPointOnLineByPoint(point, line), closest, `${explain(point)} to ${explain(line)} is ${closest}`);
    });

    t.end();
});

test('Domain/Utility/Calculate - isLinesCrossing', (t) => {
    const { isLinesCrossing } = Calculate;

    each`
        a                      | b                      | crosses
        -----------------------|------------------------|----------
        ${[[0, 0], [2, 2]]}    | ${[[0, 1], [2, 1]]}    | yes
        ${[[0, 1], [9, 2]]}    | ${[[0, 2], [9, 1]]}    | yes
        ${[[0, 1], [9, 2]]}    | ${[[0, 2], [9, 3]]}    | no
        ${[[0, 1], [1000, 2]]} | ${[[0, 2], [1000, 3]]} | no
    `(({ a, b, crosses }: any) => {
        const crossed = crosses === 'yes';
        const message = crossed ? 'crosses' : 'does not cross';
        t.equal(isLinesCrossing(a, b), crossed, `${explain(a)} ${message} ${explain(b)}`);
    });

    t.end();
});

test('Domain/Utility/Calculate - getDistanceOfPointToLine', (t) => {
    const { getDistanceOfPointToLine } = Calculate;

    each`
        point                                      | line                                                                                | distance
        -------------------------------------------|-------------------------------------------------------------------------------------|----------
        ${[1, 1]}                                  | ${[[0, 0], [3, 3]]}                                                                 | 0
        ${[2, 1]}                                  | ${[[0, 0], [3, 3]]}                                                                 | 0.7071067811865476
        ${[1, 2]}                                  | ${[[0, 0], [3, 3]]}                                                                 | 0.7071067811865476
        ${[5, 2]}                                  | ${[[0, 0], [9, 0]]}                                                                 | 2
        ${[5, 2]}                                  | ${[[0, 0], [0, 9]]}                                                                 | 5
        ${[5.909668207168579, 51.979065108032444]} | ${[[5.911760330200195, 51.97496770044958], [5.900301933288574, 51.97938231105512]]} | 0.003071307726180726
    `(({ point, line, distance }: any) => {
        t.deepEqual(getDistanceOfPointToLine(point, line), Number(distance), `from ${explain(point)} to ${explain(line)} is ${distance}`);
    });

    t.end();
});

test('Domain/Utility/Calculate - getDistanceOfLineToLine', (t) => {
    const { getDistanceOfLineToLine } = Calculate;

    each`
        a                    | b                    | distance
        ---------------------|----------------------|----------
        ${[[1, 1], [2, 2]]}  | ${[[0, 0], [3, 3]]}  | 0
        ${[[1, 1], [20, 2]]} | ${[[0, 0], [30, 2]]} | 0.6651901052377394
        ${[[2, 2], [4, 2]]}  | ${[[1, 1], [5, 1]]}  | 1
        ${[[2, 2], [4, 2]]}  | ${[[1, 1], [1, 5]]}  | 1
        ${[[2, 2], [4, 2]]}  | ${[[1, 1], [5, 5]]}  | 0
        ${[[0, 0], [2, 0]]}  | ${[[1, 1], [1, 3]]}  | 1
        ${[[0, 0], [0, 5]]}  | ${[[3, 3], [9, 3]]}  | 3
    `(({ a, b, distance }: any) => {
        t.deepEqual(getDistanceOfLineToLine(a, b), Number(distance), `from ${explain(a)} to ${explain(b)} is ${distance}`);
    });

    t.end();
});

test('Domain/Utility/Calculate - isPointOnLine', (t) => {
    const { isPointOnLine } = Calculate;

    each`
        point                                      | line                                                                                | match
        -------------------------------------------|-------------------------------------------------------------------------------------|----------
        ${[1, 1]}                                  | ${[[0, 0], [3, 3]]}                                                                 | yes
        ${[2, 1]}                                  | ${[[0, 0], [3, 3]]}                                                                 | no
        ${[1, 2]}                                  | ${[[0, 0], [3, 3]]}                                                                 | no
        ${[5, 2]}                                  | ${[[0, 0], [9, 0]]}                                                                 | no
        ${[5, 2]}                                  | ${[[0, 0], [0, 9]]}                                                                 | no
        ${[5.909668207168579, 51.979065108032444]} | ${[[5.911760330200195, 51.97496770044958], [5.900301933288574, 51.97938231105512]]} | no
        ${[5.906031131744385, 51.97717500575235]}  | ${[[5.911760330200195, 51.97496770044958], [5.900301933288574, 51.97938231105512]]} | yes
    `(({ point, line, match }: any) => {
        const output = match === 'yes';
        const message = output ? 'is on line' : 'is not on line';

        t.equal(isPointOnLine(point, line), output, `${explain(point)} ${message} ${explain(line)}`);
    });

    t.end();
});

test('Domain/Utility/Calculate - isPointInRing', (t) => {
    const { isPointInRing } = Calculate;

    each`
        point        | ring                                        | match
        -------------|---------------------------------------------|----------
        ${[0, 0]}    | ${[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]} | yes
        ${[2, 2]}    | ${[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]} | yes
        ${[1, 1]}    | ${[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]} | yes
        ${[3, 1]}    | ${[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]} | no
        ${[1, 3]}    | ${[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]} | no
        ${[0, 0]}    | ${[[1, 0], [0, 1], [1, 2], [2, 1], [1, 0]]} | no
        ${[2, 2]}    | ${[[1, 0], [0, 1], [1, 2], [2, 1], [1, 0]]} | no
        ${[1, 1]}    | ${[[1, 0], [0, 1], [1, 2], [2, 1], [1, 0]]} | yes
    `(({ point, ring, match }: any) => {
        const output = match === 'yes';
        const message = output ? 'is inside' : 'is not inside';

        t.equal(isPointInRing(point, ring), output, `${explain(point)} ${message} ${explain(ring)}`);
    });

    t.end();
});

