import type { GeometryPath } from '../../Iterator/SimpleGeometry';

export class GeoJSONError extends Error {
	constructor(
		message: string,
		public path?: GeometryPath,
	) {
		super(message);

		this.name = 'GeoJSONError';
	}
}
