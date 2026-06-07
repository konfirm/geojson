import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { distance } from '../../../source/Domain/Utility/Distance';
import { explain, type Improbability } from '../../helper/spec';
import { shapes } from '../../data/Distance';

describe('Distance — all geometry type combinations', () => {
	test('matches expected distances for all shape pairs and formulas', () => {
		for (const { a, b, cartesian, haversine, vincenty } of shapes) {
			const label = `${explain(a)} → ${explain(b)}`;
			assert.strictEqual(distance(a, b), haversine, `default ${label}`);
			assert.strictEqual(distance(a, b, 'cartesian'), cartesian, `cartesian ${label}`);
			assert.strictEqual(distance(a, b, 'haversine'), haversine, `haversine ${label}`);
			assert.strictEqual(distance(a, b, 'vincenty'), vincenty, `vincenty ${label}`);
		}
	});
});
