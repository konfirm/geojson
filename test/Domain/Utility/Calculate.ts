import test from 'tape';
import each from 'template-literal-each';
import * as Export from '../../../source/Domain/Utility/Calculate';
import { explain, exported } from '../../helper/geometry';

exported('Domain/Utility/Calculate', Export, 'getClosestPointOnLineByPoint', 'getDistanceOfPointToPoint', 'getDistanceOfPointToLine', 'getDistanceOfLineToLine', 'isLinesCrossing', 'isPointOnLine', 'isPointInRing');

test('Domain/Utility/Calculate - getDistanceOfPointToPoint', (t) => {
    const { getDistanceOfPointToPoint } = Export;

    each`
        a                                         | b                                         | direct                 | haversine                    | vincenty
        ------------------------------------------|-------------------------------------------|------------------------|------------------------------|----------
        ${[0, 0]}                                 | ${[1, 0]}                                 |   111195.07973436874   |   111195.07973436874         |   111319.49079322325
        ${[0, 0]}                                 | ${[0, 1]}                                 |   111195.07973436874   |   111195.07973436874         |   110574.38855795695
        ${[0, 0]}                                 | ${[1, 1]}                                 |   157253.589829502     |   157249.5977681334          |   156899.56829129544
        ${[0, 0]}                                 | ${[2, 1]}                                 |   248639.75704955778   |   248629.6571521291          |   248575.56516788687
        ${[0, 0]}                                 | ${[1, 2]}                                 |   248639.75704955778   |   248629.6571521291          |   247576.47264770948
        ${[0, 0]}                                 | ${[2, 2]}                                 |   314507.179659004     |   314475.23806026357         |   313775.70942909684
        ${[9, 9]}                                 | ${[1, 9]}                                 |   889560.63787495      |   878591.1714926899          |   879646.2426697082
        ${[5.911760330200195, 51.97496770044958]} | ${[5.900301933288574, 51.97938231105512]} |     1365.4087816000642 |      925.6976780365701       |      927.9989469343577
        ${[4.8422, 45.7597]}                      | ${[2.3508, 48.8567]}                      |   441970.48063825216   |   392217.2577987035          |   392431.52894877724
        ${[-180, -90]}                            | ${[180, 90]}                              | 44755156.2689204       | 20015114.352186374           | 20003931.4586233
        ${[-180, 90]}                             | ${[180, -90]}                             | 44755156.2689204       | 20015114.352186374           | 20003931.4586233
        ${[-180, 0]}                              | ${[180, 0]}                               | 40030228.70437275      |        1.5604470998469443e-9 | 20003931.4586233
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
    const { getDistanceOfPointToLine } = Export;
    const line = [[5.911760330200195, 51.97496770044958], [5.900301933288574, 51.97938231105512]];

    each`
        point                                      | line                | direct                | haversine             | vincenty         
        -------------------------------------------|---------------------|-----------------------|-----------------------|----------
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
    const { getDistanceOfLineToLine } = Export;

    each`
        a                    | b                    | direct             | haversine          | vincenty
        ---------------------|----------------------|--------------------|--------------------|----------
        ${[[1, 1], [2, 2]]}  | ${[[0, 0], [3, 3]]}  |      0             |      0             |      0
        ${[[1, 1], [20, 2]]} | ${[[0, 0], [30, 2]]} |  73965.86679042356 |  73965.72628462575 |  73555.60559277069
        ${[[2, 2], [4, 2]]}  | ${[[1, 1], [5, 1]]}  | 111195.07973436874 | 111195.07973436874 | 110575.06481449273
        ${[[2, 2], [4, 2]]}  | ${[[1, 1], [1, 5]]}  | 111195.07973436874 | 111127.34097821356 | 111252.1298001606
        ${[[2, 2], [4, 2]]}  | ${[[1, 1], [5, 5]]}  |      0             |      0             |      0
        ${[[0, 0], [2, 0]]}  | ${[[1, 1], [1, 3]]}  | 111195.07973436874 | 111195.07973436874 | 110574.38855795695
        ${[[0, 0], [0, 5]]}  | ${[[3, 3], [9, 3]]}  | 333585.23920310626 | 333127.967966738   | 333503.7471426487
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
    const { getClosestPointOnLineByPoint } = Export;

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
    const { isLinesCrossing } = Export;

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
    const { isPointOnLine } = Export;

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
    const { isPointInRing } = Export;

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
