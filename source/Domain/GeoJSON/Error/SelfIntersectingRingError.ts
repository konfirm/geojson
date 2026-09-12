import type { GeometryPath } from "../../Iterator/SimpleGeometry";
import type { Position } from "../Concept/Position";
import { GeoJSONError } from "./GeoJSONError";

export class SelfIntersectingRingError extends GeoJSONError {
	constructor(
		message: string,
		public readonly edgeA: [Position, Position],
		public readonly edgeB: [Position, Position],
		path?: GeometryPath,
	) {
		super(message, path);

		this.name = 'SelfIntersectingRingError';
	}
}
