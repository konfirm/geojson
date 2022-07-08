import { isArray, Validator } from "@konfirm/guard";
import { Guard } from './Utility';

export function isTuple<T extends Array<unknown>>(...rules: Array<Validator>): Guard<T> {
	return (value: any): value is T => isArray(value) && value.length === rules.length && rules.every((rule, index) => rule(value[index]));
}
