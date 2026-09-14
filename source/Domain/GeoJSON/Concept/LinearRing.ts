import { all, isArrayOfSize, isArrayOfType } from '@konfirm/guard';
import { isPosition, isStrictPosition, type Position } from './Position';

export type LinearRing = Array<Position>;

export const isClosedRing = all<LinearRing>(
	isArrayOfType(isPosition),
	isArrayOfSize(2),
	(value: Array<Position>) =>
		value[value.length - 1].every((v, i) => v === value[0][i]),

)
export const isLinearRing = all<LinearRing>(
	isArrayOfSize(4),
	isClosedRing,
);
export const isStrictLinearRing = all<LinearRing>(
	isArrayOfType(isStrictPosition),
	isArrayOfSize(4),
	isClosedRing,
);
