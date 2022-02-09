import test from 'tape';
import { distance } from '../../../source/Domain/Utility/Distance';
import { explain } from '../../helper/geometry';
import { shapes } from '../../data/Distance';

shapes
    .reduce((carry, shape) => carry.concat(shape, shape.a.type !== shape.b.type ? { ...shape, a: shape.b, b: shape.a } : []), [])
    .forEach(({ a, b, distance: d }) => {
        test(`Domain/Utility/Distance - distance ${a.type} to ${b.type}`, (t) => {
            t.equal(distance(a, b), d, `${explain(a)} to ${explain(b)} is ${d}`);

            t.end();
        });
    });
