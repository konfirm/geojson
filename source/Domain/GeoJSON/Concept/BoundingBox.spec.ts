import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import * as Export from './BoundingBox';

const { isBoundingBox, isStrictBoundingBox } = Export;

describe('Domain/GeoJSON/Concept/BoundingBox', () => {
	describe('isBoundingBox', () => {
		test('returns true for valid bounding boxes', () => {
			each`
				input
				---
				${[-10.0, -10.0, 10.0, 10.0]}
				${[100.0, 0.0, 105.0, 1.0]}
				${[100.0, 0.0, -100.0, 105.0, 1.0, 0.0]}
				${[177.0, -20.0, -178.0, -16.0]}
				${[-178.0, -20.0, 177.0, -16.0]}
				${[-370.0, -190.0, 190.0, 370.0]}
				${[0, 0, 0, 0]}
				${[-180, -90, 180, 90]}
				${[0, 0, 0, 0, 0, 0]}
				${[-180, -90, 0, 180, 90, 0]}
				${[180, -90, 0, -180, 90, 0]}
				${[-181, -91, 0, 181, 91, 0]}
			`(({ input }: any) => {
				assert.ok(isBoundingBox(input), `[${input}] is a valid bounding box`);
			});
		});

		test('returns false for invalid bounding boxes', () => {
			each`
				input
				---
				${[]}
				${[0]}
				${[-180]}
				${[0, 0]}
				${[-180, -90]}
				${[0, 0, 0]}
				${[-180, -90, 180]}
				${[0, 0, 0, 0, 0]}
				${[-180, -90, 0, 180, 90]}
				${[180, 90, 0, -180, -90, 0]}
				${[-180, 90, 0, 180, -90, 0]}
			`(({ input }: any) => {
				assert.ok(!isBoundingBox(input), `[${input}] is not a valid bounding box`);
			});
		});
	});

	describe('isStrictBoundingBox', () => {
		test('returns true for valid strict bounding boxes', () => {
			each`
				input
				---
				${[-10.0, -10.0, 10.0, 10.0]}
				${[100.0, 0.0, 105.0, 1.0]}
				${[100.0, 0.0, -100.0, 105.0, 1.0, 0.0]}
				${[177.0, -20.0, -178.0, -16.0]}
				${[-178.0, -20.0, 177.0, -16.0]}
				${[0, 0, 0, 0]}
				${[-180, -90, 180, 90]}
				${[0, 0, 0, 0, 0, 0]}
				${[-180, -90, 0, 180, 90, 0]}
				${[180, -90, 0, -180, 90, 0]}
			`(({ input }: any) => {
				assert.ok(isStrictBoundingBox(input), `[${input}] is a valid strict bounding box`);
			});
		});

		test('returns false for out-of-range or invalid bounding boxes', () => {
			each`
				input
				---
				${[-370.0, -190.0, 190.0, 370.0]}
				${[]}
				${[0]}
				${[-180]}
				${[0, 0]}
				${[-180, -90]}
				${[0, 0, 0]}
				${[-180, -90, 180]}
				${[0, 0, 0, 0, 0]}
				${[-180, -90, 0, 180, 90]}
				${[180, 90, 0, -180, -90, 0]}
				${[-180, 90, 0, 180, -90, 0]}
				${[-181, -91, 0, 181, 91, 0]}
			`(({ input }: any) => {
				assert.ok(!isStrictBoundingBox(input), `[${input}] is not a valid strict bounding box`);
			});
		});
	});
});
