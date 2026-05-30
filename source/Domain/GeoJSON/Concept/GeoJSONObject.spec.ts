import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import type { Improbability } from '../../../../test/helper/spec';
import * as Export from './GeoJSONObject';

const { isGeoJSONObject, isStrictGeoJSONObject } = Export;

describe('Domain/GeoJSON/Concept/GeoJSONObject', () => {
	describe('isGeoJSONObject', () => {
		test('creates a validator that accepts valid objects', () => {
			each`
				type         | bbox
				-------------|---
				Type         |
				Type         | ${[0, 0, 0, 0]}
				Type         | ${[0, 0, 0, 0, 0, 0]}
				Type         | ${[-181, -91, 0, 181, 91, 0]}
			`(({ type, bbox }: Improbability) => {
				const validate = isGeoJSONObject(type);
				const input = Object.assign({ type }, bbox ? { bbox } : {});
				assert.strictEqual(
					typeof validate,
					'function',
					`creates validator for ${JSON.stringify(type)}`,
				);
				assert.ok(
					validate(input),
					`type ${JSON.stringify(type)} validates ${JSON.stringify(input)}`,
				);
			});
		});

		test('creates a validator that rejects invalid objects', () => {
			each`
				type
				---
				${undefined}
				${null}
				${true}
				${false}
				${12345}
			`(({ type }: Improbability) => {
				const validate = isGeoJSONObject(type);
				const input = { type };
				assert.strictEqual(
					typeof validate,
					'function',
					`creates validator for ${JSON.stringify(type)}`,
				);
				assert.ok(
					!validate(input),
					`type ${JSON.stringify(type)} rejects ${JSON.stringify(input)}`,
				);
			});
		});
	});

	describe('isStrictGeoJSONObject', () => {
		test('creates a validator that accepts valid strict objects', () => {
			each`
				type  | bbox
				------|---
				Type  |
				Type  | ${[0, 0, 0, 0]}
				Type  | ${[0, 0, 0, 0, 0, 0]}
			`(({ type, bbox }: Improbability) => {
				const validate = isStrictGeoJSONObject(type);
				const input = Object.assign({ type }, bbox ? { bbox } : {});
				assert.ok(
					validate(input),
					`type ${JSON.stringify(type)} validates ${JSON.stringify(input)}`,
				);
			});
		});

		test('creates a validator that rejects out-of-range bbox or invalid type', () => {
			each`
				type         | bbox
				-------------|---
				Type         | ${[-181, -91, 0, 181, 91, 0]}
				${undefined} |
				${null}      |
				${true}      |
				${false}     |
				${12345}     |
			`(({ type, bbox }: Improbability) => {
				const validate = isStrictGeoJSONObject(type);
				const input = Object.assign({ type }, bbox ? { bbox } : {});
				assert.ok(
					!validate(input),
					`type ${JSON.stringify(type)} rejects ${JSON.stringify(input)}`,
				);
			});
		});
	});
});
