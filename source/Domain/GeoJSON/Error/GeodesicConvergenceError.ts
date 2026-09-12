import type { GeometryPath } from "../../Iterator/SimpleGeometry";
import { GeoJSONError } from "./GeoJSONError";

export class GeodesicConvergenceError extends GeoJSONError {
	constructor(
		message: string,
		path?: GeometryPath,
		public counterpart?: GeometryPath,
	) {
		super(message, path);

		this.name = 'GeodesicConvergenceError';
	}
}
