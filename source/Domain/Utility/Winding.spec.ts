import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import type { Improbability } from '../../../test/helper/spec';
import { isClockwiseWinding, isCounterClockwiseWinding } from './Winding';

// RFC 7946 §3.1.6 — exterior rings are counterclockwise, holes are clockwise.
// Appendix A.3 canonical examples: https://www.rfc-editor.org/rfc/rfc7946#appendix-A.3
const RFC7946_EXTERIOR = [
	[100.0, 0.0],
	[101.0, 0.0],
	[101.0, 1.0],
	[100.0, 1.0],
	[100.0, 0.0],
];
const RFC7946_HOLE = [
	[100.8, 0.8],
	[100.8, 0.2],
	[100.2, 0.2],
	[100.2, 0.8],
	[100.8, 0.8],
];

// A 2°×2° box straddling the antimeridian (RFC 7946 §3.1.9). Unwrapped,
// this traces (179,0) -> (179,2) -> (181,2) -> (181,0) -> back: up the
// left side, across the top, down the right side, across the bottom —
// clockwise. Reversing the vertex order makes it counterclockwise.
const ANTIMERIDIAN_CW = [
	[179, 0],
	[179, 2],
	[-179, 2],
	[-179, 0],
	[179, 0],
];
const ANTIMERIDIAN_CCW = [
	[179, 0],
	[-179, 0],
	[-179, 2],
	[179, 2],
	[179, 0],
];

describe('Domain/Utility/Winding', () => {
	describe('isClockwiseWinding', () => {
		test('returns true for clockwise or degenerate rings', () => {
			each`
				position
				---
				${[[0, 0], [1, 0]]}
				${[[0, 0], [0, 1], [1, 1]]}
				${[[0, 0], [0, 1], [1, 1], [1, 0]]}
				${[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]}
				${[[0, 0], [1, 0], [0, 1], [1, 1]]}
				${[[0, 0]]}
				${[[0, 0], [0, 1]]}
				${[[1, 1], [0, 1], [1, 0], [0, 0]]}
				${RFC7946_HOLE}
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
				${[[0, 0], [1, 0], [1, 1]]}
				${[[0, 0], [1, 0], [1, 1], [0, 1]]}
				${[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]}
				${RFC7946_EXTERIOR}
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
				${[[0, 0], [1, 0], [1, 1]]}
				${[[0, 0], [1, 0], [1, 1], [0, 1]]}
				${[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]}
				${[[1, 1], [0, 1], [1, 0], [0, 0]]}
				${RFC7946_EXTERIOR}
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
				${[[0, 0], [0, 1], [1, 1]]}
				${[[0, 0], [0, 1], [1, 1], [1, 0]]}
				${[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]}
				${RFC7946_HOLE}
			`(({ position }: Improbability) => {
				assert.ok(
					!isCounterClockwiseWinding(position),
					`not isCounterClockwiseWinding ${JSON.stringify(position)}`,
				);
			});
		});
	});

	describe('rings crossing the antimeridian', () => {
		test('isClockwiseWinding identifies the clockwise ring, not the counter-clockwise one', () => {
			assert.ok(isClockwiseWinding(ANTIMERIDIAN_CW));
			assert.ok(!isClockwiseWinding(ANTIMERIDIAN_CCW));
		});

		test('isCounterClockwiseWinding identifies the counter-clockwise ring, not the clockwise one', () => {
			assert.ok(isCounterClockwiseWinding(ANTIMERIDIAN_CCW));
			assert.ok(!isCounterClockwiseWinding(ANTIMERIDIAN_CW));
		});
	});
});
