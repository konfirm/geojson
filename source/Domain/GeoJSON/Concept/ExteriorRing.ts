import { all } from "@konfirm/guard";
import { isCounterClockwiseWinding } from "../../Utility/Winding";
import { isLinearRing, isStrictLinearRing, LinearRing } from "./LinearRing";

export type ExteriorRing = LinearRing;
export const isExteriorRing = all<ExteriorRing>(
	isLinearRing,
);
export const isStrictExteriorRing = all<ExteriorRing>(
	isStrictLinearRing,
	isCounterClockwiseWinding
);
