import { isNumber } from '@konfirm/guard';
import { Guard } from './Utility';

export function isNumberValue<T extends number>(value: any): value is T {
	return isNumber(value) && Number.isFinite(value);
}

export function isNumberBetween<T extends number>(a: number, b: number = Infinity): Guard<T> {
	const min = Math.min(a, b);
	const max = Math.max(a, b);

	return (value: any): value is T => isNumberValue(value) && value >= min && value <= max;
}
