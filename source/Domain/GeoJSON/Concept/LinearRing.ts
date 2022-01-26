import { all, isArrayOfSize, isArrayOfType } from "@konfirm/guard";
import { isPosition, isStrictPosition, Position } from "./Position";

export type LinearRing = Array<Position>;
export const isLinearRing = all<LinearRing>(
	isArrayOfType(isPosition),
	isArrayOfSize(4),
	(value: Array<Position>) => value[value.length - 1].every((v, i) => v === value[0][i])
);
export const isStrictLinearRing = all<LinearRing>(
	isArrayOfType(isStrictPosition),
	isArrayOfSize(4),
	(value: Array<Position>) => value[value.length - 1].every((v, i) => v === value[0][i])
);
