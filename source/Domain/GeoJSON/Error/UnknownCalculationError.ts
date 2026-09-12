import type { GeometryPath } from "../../Iterator/SimpleGeometry";
import { GeoJSONError } from "./GeoJSONError";

export class UnknownCalculationError extends GeoJSONError {
	constructor(message: string, path?: GeometryPath) {
		super(message, path);

		this.name = 'UnknownCalculationError';
	}
}
