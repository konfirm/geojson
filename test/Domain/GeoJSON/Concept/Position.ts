import test from 'tape';
import * as Export from '../../../../source/Domain/GeoJSON/Concept/Position';
import { coordinates } from '../../../data/HolySee';
import { exported } from '../../../helper/geometry';

exported('Domain/GeoJSON/Concept/Position', Export, 'isPosition', 'isStrictPosition', 'isEquivalentPosition');

const { isPosition, isStrictPosition, isEquivalentPosition } = Export;
const altitude = coordinates.map(([lon, lat, alt = 1.23]) => [lon, lat, alt]);

test('Domain/GeoJSON/Concept/Position - isPosition', (t) => {
	t.ok(coordinates.every(isPosition), 'all coordinates match isPosition');
	t.ok(altitude.every(isPosition), 'all coordinates with altitude match isPosition');

	t.notOk(isPosition([Infinity, 0, 0]), `[Infinity, 0, 0] is not a Position`);
	t.notOk(isPosition([0, Infinity, 0]), `[0, Infinity, 0] is not a Position`);
	t.notOk(isPosition([0, 0, Infinity]), `[0, 0, Infinity] is not a Position`);
	t.ok(isPosition([0, 0, 0]), `[0, 0, 0] is Position`);
	t.ok(isPosition([-181, 0, 0]), `[-181, 0, 0] is Position`);
	t.ok(isPosition([0, -91, 0]), `[0, -91, 0] is Position`);
	t.ok(isPosition([0, 0, -7000000]), `[0, 0, -7000000] is Position`);
	t.ok(isPosition([-181, -91, 0]), `[-181, -91, 0] is Position`);
	t.ok(isPosition([0, -91, -7000000]), `[0, -91, -7000000] is Position`);
	t.ok(isPosition([-181, 0, -7000000]), `[-181, 0, -7000000] is Position`);
	t.ok(isPosition([-181, -91, -7000000]), `[-181, -91, -7000000] is Position`);

	t.end();
});

test('Domain/GeoJSON/Concept/Position - isStrictPosition', (t) => {
	t.ok(coordinates.every(isStrictPosition), 'all coordinates match isStrictPosition');
	t.ok(altitude.every(isStrictPosition), 'all coordinates with altitude match isStrictPosition');

	t.notOk(isStrictPosition([Infinity, 0, 0]), `[Infinity, 0, 0] is not a strict Position`);
	t.notOk(isStrictPosition([0, Infinity, 0]), `[0, Infinity, 0] is not a strict Position`);
	t.notOk(isStrictPosition([0, 0, Infinity]), `[0, 0, Infinity] is not a strict Position`);
	t.ok(isStrictPosition([0, 0, 0]), `[0, 0, 0] is strict Position`);
	t.notOk(isStrictPosition([-181, 0, 0]), `[-181, 0, 0] is not a strict Position`);
	t.notOk(isStrictPosition([0, -91, 0]), `[0, -91, 0] is not a strict Position`);
	t.notOk(isStrictPosition([0, 0, -7000000]), `[0, 0, -7000000] is not a strict Position`);
	t.notOk(isStrictPosition([-181, -91, 0]), `[-181, -91, 0] is not a strict Position`);
	t.notOk(isStrictPosition([0, -91, -7000000]), `[0, -91, -7000000] is not a strict Position`);
	t.notOk(isStrictPosition([-181, 0, -7000000]), `[-181, 0, -7000000] is not a strict Position`);
	t.notOk(isStrictPosition([-181, -91, -7000000]), `[-181, -91, -7000000] is not a strict Position`);

	t.end();
});

test('Domain/GeoJSON/Concept/Position - isEquivalentPosition', (t) => {
	t.ok(isEquivalentPosition([1.23456789, 2.3456789], [1.23456789, 2.3456789]), `[1.23456789,2.3456789] and [1.23456789,2.3456789] are equivalent`);
	t.ok(isEquivalentPosition([1.23456789, 2.3456789, 3.456789], [1.23456789, 2.3456789, 3.456789]), `[1.23456789,2.3456789,3.456789] and [1.23456789,2.3456789,3.456789] are equivalent`);
	t.notOk(isEquivalentPosition([1.23456789, 2.3456789, 3.456789], [1.23456789, 2.3456789]), `[1.23456789,2.3456789,3.456789] and [1.23456789,2.3456789] are not equivalent`);
	t.notOk(isEquivalentPosition([1.23456789, 2.3456789], [1.23456789, 2.3456789, , 3.456789]), `[1.23456789,2.3456789] and [1.23456789,2.3456789,,3.456789] are not equivalent`);

	t.end();
});
