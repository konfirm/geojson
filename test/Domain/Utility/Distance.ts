import test from 'tape';
import * as Export from '../../../source/Domain/Utility/Distance';
import { explain, exported } from '../../helper/geometry';
import { shapes } from '../../data/Distance';

exported('Domain/Utility/Distance', Export, 'distance');

const { distance } = Export;

test(`Domain/Utility/Distance - distance`, (t) => {
    shapes
        .forEach(({ a, b, cartesian, haversine, vincenty }) => {
            t.equal(distance(a, b), cartesian, `default calculation: ${explain(a)} to ${explain(b)} is ${cartesian}`);
            t.equal(distance(a, b, 'cartesian'), cartesian, `'cartesian' calculation: ${explain(a)} to ${explain(b)} is ${cartesian}`);
            t.equal(distance(a, b, 'haversine'), haversine, `'haversine' calculation: ${explain(a)} to ${explain(b)} is ${haversine}`);
            t.equal(distance(a, b, 'vincenty'), vincenty, `'vincenty' calculation: ${explain(a)} to ${explain(b)} is ${vincenty}`);
        });
    t.end();
});
