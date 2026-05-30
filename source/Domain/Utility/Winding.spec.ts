import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import type { Improbability } from '../../../test/helper/spec';
import { isClockwiseWinding, isCounterClockwiseWinding } from './Winding';

describe('Domain/Utility/Winding', () => {
	describe('isClockwiseWinding', () => {
		test('returns true for clockwise or degenerate rings', () => {
			each`
				position
				---
				${[[0, 0], [1, 0]]}
				${[[0, 0], [1, 0], [1, 1]]}
				${[[0, 0], [1, 0], [1, 1], [0, 1]]}
				${[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]}
				${[[0, 0], [1, 0], [0, 1], [1, 1]]}
				${[[0, 0]]}
				${[[0, 0], [0, 1]]}
				${[[1, 1], [0, 1], [1, 0], [0, 0]]}
			`(({ position }: Improbability) => {
				assert.ok(
					isClockwiseWinding(position),
					`isClockwiseWinding ${JSON.stringify(position)}`,
				);
			});
		});

		test('returns false for counter-clockwise rings', () => {
			each`
				position
				---
				${[[0, 0], [0, 1], [1, 1]]}
				${[[0, 0], [0, 1], [1, 1], [1, 0]]}
				${[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]}
			`(({ position }: Improbability) => {
				assert.ok(
					!isClockwiseWinding(position),
					`not isClockwiseWinding ${JSON.stringify(position)}`,
				);
			});
		});
	});

	describe('isCounterClockwiseWinding', () => {
		test('returns true for counter-clockwise or degenerate rings', () => {
			each`
				position
				---
				${[[0, 0], [1, 0]]}
				${[[0, 0], [1, 0], [0, 1], [1, 1]]}
				${[[0, 0]]}
				${[[0, 0], [0, 1]]}
				${[[0, 0], [0, 1], [1, 1]]}
				${[[0, 0], [0, 1], [1, 1], [1, 0]]}
				${[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]}
				${[[1, 1], [0, 1], [1, 0], [0, 0]]}
			`(({ position }: Improbability) => {
				assert.ok(
					isCounterClockwiseWinding(position),
					`isCounterClockwiseWinding ${JSON.stringify(position)}`,
				);
			});
		});

		test('returns false for clockwise rings', () => {
			each`
				position
				---
				${[[0, 0], [1, 0], [1, 1]]}
				${[[0, 0], [1, 0], [1, 1], [0, 1]]}
				${[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]}
			`(({ position }: Improbability) => {
				assert.ok(
					!isCounterClockwiseWinding(position),
					`not isCounterClockwiseWinding ${JSON.stringify(position)}`,
				);
			});
		});
	});
});
