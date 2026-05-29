import { type Guard, isArray, type Validator } from '@konfirm/guard';

export function isTuple<T extends Array<unknown>>(
	...rules: Array<Validator>
): Guard<T> {
	return (value: unknown): value is T =>
		isArray(value) &&
		value.length === rules.length &&
		rules.every((rule, index) => rule(value[index]));
}
