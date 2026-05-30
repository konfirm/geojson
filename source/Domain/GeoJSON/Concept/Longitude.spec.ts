import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import * as Export from './Longitude';

const { isLongitude, isStrictLongitude } = Export;

describe('Domain/GeoJSON/Concept/Longitude', () => {
	describe('isLongitude', () => {
		test('returns true for valid longitudes', () => {
			each`
				input
				---
				${0}
				${0.0000000001}
				${5.8987296}
				${-180}
				${-180.1}
				${180}
				${180.1}
			`(({ input }: any) => {
				assert.ok(isLongitude(input), `${input} is valid longitude`);
			});
		});

		test('returns false for invalid longitudes', () => {
			each`
				input
				---
				${-Infinity}
				${Infinity}
				${NaN}
				${'1234'}
				${false}
				${true}
			`(({ input }: any) => {
				assert.ok(!isLongitude(input), `${input} is not valid longitude`);
			});
		});
	});

	describe('isStrictLongitude', () => {
		test('returns true for valid strict longitudes', () => {
			each`
				input
				---
				${0}
				${0.0000000001}
				${5.8987296}
				${-180}
				${180}
			`(({ input }: any) => {
				assert.ok(isStrictLongitude(input), `${input} is valid strict longitude`);
			});
		});

		test('returns false for out-of-range or invalid longitudes', () => {
			each`
				input
				---
				${-180.1}
				${180.1}
				${-Infinity}
				${Infinity}
				${NaN}
				${'1234'}
				${false}
				${true}
			`(({ input }: any) => {
				assert.ok(!isStrictLongitude(input), `${input} is not valid strict longitude`);
			});
		});
	});
});
