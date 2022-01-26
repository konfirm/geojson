import { isNumber } from "@konfirm/guard";

type Target = { [key: string]: unknown };
type GeometryTarget = Target & { type: string };

function omit(o: Target): Array<Target> {
	return Object.keys(o)
		.map((key) => {
			const { [key]: _omit, ...rest } = o;

			return rest;
		});
}

function less(a: Array<unknown>): Array<unknown> {
	if (isNumber(a[0])) {
		return a.slice(0, 1);
	}

	return a.map((v) => less(v as Array<unknown>));
}

function more(a: Array<unknown>): Array<unknown> {
	if (isNumber(a[0])) {
		return a.concat(Math.random(), Math.random());
	}

	return a.map((v) => more(v as Array<unknown>));
}

function values(a: Array<unknown>, add: number): Array<unknown> {
	if (isNumber(a[0])) {
		return a.map((v) => (v as number) + add);
	}

	return a.map((v) => values(v as Array<unknown>, add));
}

export function geometry(o: GeometryTarget, strict: boolean = false): Array<Target> {
	const malformed = omit(o);

	switch (o.type) {
		case 'Feature':
			malformed.push(
				{ ...o, geometry: geometry(o.geometry as GeometryTarget, strict) },
			);
			break;
		case 'FeatureCollection':
			malformed.push(
				{ ...o, features: (o.features as Array<GeometryTarget>).map((v) => geometry(v, strict)) },
			);
			break;
		case 'GeometryCollection':
			malformed.push(
				{ ...o, geometries: (o.geometries as Array<GeometryTarget>).map((v) => geometry(v, strict)) },
			);
			break;

		default:
			const mapped = coordinates(o.coordinates as Array<unknown>, strict);

			malformed.push(...mapped.map((coordinates) => ({ ...o, coordinates })));
	}

	return malformed;
}

export function coordinates(a: Array<unknown>, strict: boolean = false): Array<typeof a> {
	const malformed = [
		less(a),
		more(a),
	];

	if (strict) {
		malformed.push(
			values(a, 360),
			values(a, -360),
		);
	}

	return malformed;
}
