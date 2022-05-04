import test from 'tape';
import { distance } from '../../../source/Domain/Utility/Distance';
import { explain } from '../../helper/geometry';
import { shapes } from '../../data/Distance';

test(`Domain/Utility/Distance - distance`, (t) => {
    shapes
        .forEach(({ a, b, direct, haversine, vincenty }) => {
            t.equal(distance(a, b), direct, `default calculation: ${explain(a)} to ${explain(b)} is ${direct}`);
            t.equal(distance(a, b, 'direct'), direct, `'direct' calculation: ${explain(a)} to ${explain(b)} is ${direct}`);
            t.equal(distance(a, b, 'haversine'), haversine, `'haversine' calculation: ${explain(a)} to ${explain(b)} is ${haversine}`);
            t.equal(distance(a, b, 'vincenty'), vincenty, `'vincenty' calculation: ${explain(a)} to ${explain(b)} is ${vincenty}`);
        });
    t.end();
});
