import type { GeometryPath } from '../../Iterator/SimpleGeometry';

// Extends EvalError, not GeoJSONError: this is what the library has always
// thrown for Vincenty non-convergence (predating this error hierarchy), and
// changing that ancestry would silently break any existing `instanceof
// EvalError` check. Deliberately not routed through GeoJSONError, so it
// doesn't misrepresent EvalError as part of that shared ancestry too.
export class GeodesicConvergenceError extends EvalError {
	constructor(
		message: string,
		public path?: GeometryPath,
		public counterpart?: GeometryPath,
	) {
		super(message);

		this.name = 'GeodesicConvergenceError';
	}
}
