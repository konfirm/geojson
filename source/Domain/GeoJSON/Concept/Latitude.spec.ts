import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import * as Export from './Latitude';

const { isLatitude, isStrictLatitude } = Export;

describe('Domain/GeoJSON/Concept/Latitude', () => {
	describe('isLatitude', () => {
		test('returns true for valid latitudes', () => {
			each`
				input
				---
				${0}
				${0.0000000001}
				${51.9851034}
				${-90}
				${-90.1}
				${90}
				${90.1}
			`(({ input }: any) => {
				assert.ok(isLatitude(input), `${input} is valid latitude`);
			});
		});

		test('returns false for invalid latitudes', () => {
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
				assert.ok(!isLatitude(input), `${input} is not valid latitude`);
			});
		});
	});

	describe('isStrictLatitude', () => {
		test('returns true for valid strict latitudes', () => {
			each`
				input
				---
				${0}
				${0.0000000001}
				${51.9851034}
				${-90}
				${90}
			`(({ input }: any) => {
				assert.ok(isStrictLatitude(input), `${input} is valid strict latitude`);
			});
		});

		test('returns false for out-of-range or invalid latitudes', () => {
			each`
				input
				---
				${-90.1}
				${90.1}
				${-Infinity}
				${Infinity}
				${NaN}
				${'1234'}
				${false}
				${true}
			`(({ input }: any) => {
				assert.ok(!isStrictLatitude(input), `${input} is not valid strict latitude`);
			});
		});
	});
});
