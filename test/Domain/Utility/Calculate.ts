import test from 'tape';
import each from 'template-literal-each';
import * as Calculate from '../../../source/Domain/Utility/Calculate';
import { explain } from '../../helper/geometry';

test('Domain/Utility/Calculate - exports', (t) => {
    const expected = [
        'getClosestPointOnLineByPoint',
        'getDistanceOfPointToPoint',
        'getDistanceOfPointToLine',
        'getDistanceOfLineToLine',
        'isLinesCrossing',
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
        a                                         | b                                         | absolute             | haversine          | wgs84
        ------------------------------------------|-------------------------------------------|----------------------|--------------------|-------
        ${[0, 0]}                                 | ${[1, 0]}                                 | 1                    | 111319.49079327357 | 111319.49079327358
        ${[0, 0]}                                 | ${[0, 1]}                                 | 1                    | 111319.49079327357 | 110572.98510774602
        ${[0, 0]}                                 | ${[1, 1]}                                 | 1.4142135623730951   | 157425.537108412   | 156896.58824477842
        ${[0, 0]}                                 | ${[2, 1]}                                 | 2.23606797749979     | 248907.83743668246 | 248569.91472117603
        ${[0, 0]}                                 | ${[1, 2]}                                 | 2.23606797749979     | 248907.83743668246 | 247561.39986867533
        ${[0, 0]}                                 | ${[2, 2]}                                 | 2.8284271247461903   | 314827.08993590315 | 313751.8796746002
        ${[9, 9]}                                 | ${[1, 9]}                                 | 8                    | 879574.1867326713  | 879663.7626909065
        ${[5.911760330200195, 51.97496770044958]} | ${[5.900301933288574, 51.97938231105512]} | 0.012279399276135748 | 926.7333985794701  | 927.9989494282199
        ${[4.8422, 45.7597]}                      | ${[2.3508, 48.8567]}                      | 3.974730551873921    | 392656.09164351074 | 392415.2429878265
    `(({ a, b, ...calc }: any) => {
        Object.keys(calc).forEach((key) => {
            const value = Number(calc[key]);
            t.equal(getDistanceOfPointToPoint(a, b, key as any), value, `${key} distance from ${explain(a)} to ${explain(b)} is ${value}`);
        });
    });

    t.equal(getDistanceOfPointToPoint([0, 0], [0, 0], () => Math.PI), Math.PI, 'Allows for custom function');
    t.throws(() => getDistanceOfPointToPoint([0, 0], [1, 1], 'unknown'), /Not a PointToPoint calculation function unknown/);

    t.end();
});

test('Domain/Utility/Calculate - getDistanceOfPointToLine', (t) => {
    const { getDistanceOfPointToLine } = Calculate;
    const line = [[5.911760330200195, 51.97496770044958], [5.900301933288574, 51.97938231105512]];

    each`
        point                                      | line                | absolute             | haversine          | wgs84         
        -------------------------------------------|---------------------|----------------------|--------------------|--------           
        ${[1, 1]}                                  | ${[[0, 0], [3, 3]]} | 0                    | 0                  | 0
        ${[2, 1]}                                  | ${[[0, 0], [3, 3]]} | 0.7071067811865476   | 78705.27630557417  | 78442.09378740854
        ${[1, 2]}                                  | ${[[0, 0], [3, 3]]} | 0.7071067811865476   | 78696.28705105482  | 78433.31373086644
        ${[5, 2]}                                  | ${[[0, 0], [9, 0]]} | 2                    | 222638.98158654713 | 221138.22586820205
        ${[5, 2]}                                  | ${[[0, 0], [0, 9]]} | 5                    | 556258.174692382   | 556260.6576005204
        ${[1, 1]}                                  | ${[[0, 0], [9, 0]]} | 1                    | 111319.49079327357 | 110572.98510774602
        ${[3, 1]}                                  | ${[[0, 0], [9, 0]]} | 1                    | 111319.49079327357 | 110572.98510774602
        ${[5, 1]}                                  | ${[[0, 0], [9, 0]]} | 1                    | 111319.49079327357 | 110572.98510774602
        ${[7, 1]}                                  | ${[[0, 0], [9, 0]]} | 1                    | 111319.49079327357 | 110572.98510774602
        ${[5.909668207168579, 51.979065108032444]} | ${line}             | 0.003071307726180726 | 327.89804582530377 | 327.78795649673697
    `(({ point, line, ...calc }: any) => {
        Object.keys(calc).forEach((key) => {
            const value = Number(calc[key]);
            t.equal(getDistanceOfPointToLine(point, line, key as any), value, `${key} distance from ${explain(point)} to ${explain(line)} is ${value}`);
        });
    });

    t.equal(getDistanceOfPointToLine([0, 0], [[0, 0], [1, 1]], () => Math.PI), Math.PI, 'Allows for custom function');
    t.throws(() => getDistanceOfPointToLine([0, 0], [[0, 0], [1, 1]], 'unknown'), /Not a PointToPoint calculation function unknown/);

    t.end();
});

test('Domain/Utility/Calculate - getDistanceOfLineToLine', (t) => {
    const { getDistanceOfLineToLine } = Calculate;

    each`
        a                    | b                    | absolute           | haversine          | wgs84
        ---------------------|----------------------|--------------------|--------------------|--------
        ${[[1, 1], [2, 2]]}  | ${[[0, 0], [3, 3]]}  | 0                  | 0                  | 0
        ${[[1, 1], [20, 2]]} | ${[[0, 0], [30, 2]]} | 0.6651901052377394 | 74048.48313278591  | 73555.19251094996
        ${[[2, 2], [4, 2]]}  | ${[[1, 1], [5, 1]]}  | 1                  | 111319.49079327357 | 110573.66135570193
        ${[[2, 2], [4, 2]]}  | ${[[1, 1], [1, 5]]}  | 1                  | 111251.67624734061 | 111252.13152010409
        ${[[2, 2], [4, 2]]}  | ${[[1, 1], [5, 5]]}  | 0                  | 0                  | 0
        ${[[0, 0], [2, 0]]}  | ${[[1, 1], [1, 3]]}  | 1                  | 111319.49079327357 | 110572.98510774602
        ${[[0, 0], [0, 5]]}  | ${[[3, 3], [9, 3]]}  | 3                  | 333500.68952370394 | 333503.8515201999
    `(({ a, b, ...calc }: any) => {
        Object.keys(calc).forEach((key) => {
            const value = Number(calc[key]);
            t.equal(getDistanceOfLineToLine(a, b, key as any), value, `${key} distance from ${explain(a)} to ${explain(b)} is ${value}`);
        });
    });

    t.equal(getDistanceOfLineToLine([[0, 0], [1, 1]], [[0, 0], [1, 1]], () => Math.PI), Math.PI, 'Allows for custom function');
    t.throws(() => getDistanceOfLineToLine([[0, 0], [0, 1]], [[1, 0], [1, 1]], 'unknown'), /Not a PointToPoint calculation function unknown/);

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
