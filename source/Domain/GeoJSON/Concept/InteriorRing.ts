import { all } from "@konfirm/guard";
import { isClockwiseWinding } from "../../Utility/Winding";
import { isLinearRing, isStrictLinearRing, LinearRing } from "./LinearRing";

export type InteriorRing = LinearRing;
export const isInteriorRing = all<InteriorRing>(
	isLinearRing,
);
export const isStrictInteriorRing = all<InteriorRing>(
	isStrictLinearRing,
	isClockwiseWinding
);
