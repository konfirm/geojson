import test from 'tape';
import * as Shapes from '../data/Shapes';
import { geometry, coordinates } from './malform';

const shapes = Object.keys(Shapes).map((key) => Shapes[key]);
const geometries = shapes.filter(({ coordinates }) => coordinates);

export function explain(value: any): string {
	return JSON.stringify(value).replace(/^(.{24}).{3,}(.{24})$/, '$1 … $2');
}

export function exported(group, exports, ...expect: Array<string>) {
	test(`${group} - exports`, (t) => {
		t.deepEqual(Object.keys(exports), expect, `exports ${expect.join(', ')}`);
		expect.forEach((key) => {
			t.equal(typeof exports[key], 'function', `${key} is a function`);
		});

		t.end();
	});
}

export function runner(group, exports, ...run: Array<string | [string, Array<string>]>) {
	const config = run.map((fun) => (Array.isArray(fun) ? fun : [fun, []]) as [string, Array<string>]);

	exported(group, exports, ...config.map(([fun]) => fun));

	config
		.forEach(([fun, types = []]) => {
			const exec = exports[fun];
			const [, is, strict, name, coords] = fun.match(/^(is)(Strict)?(.+?)(Coordinates)?$/);
			const type = `${strict ? 'strict ' : ''}${name}`;

			test(`${group} - ${fun}`, (t) => {
				if (coords) {
					geometries.forEach((shape) => {
						if (shape.type === name || types.includes(shape.type)) {
							t.ok(exec(shape.coordinates), `${explain(shape.coordinates)} is ${type} coordinates`);

							coordinates(shape.coordinates, Boolean(strict))
								.forEach((coordinates) => {
									t.notOk(exec(coordinates), `${explain(coordinates)} is not ${type} coordinates`);
								})
						}
						else {
							t.notOk(exec(shape.coordinates), `${explain(shape.coordinates)} is not ${type} coordinates`);
						}
					});
				}
				else {
					shapes.forEach((shape: any) => {
						if (shape.type === name || types.includes(shape.type)) {
							t.ok(exec(shape), `${explain(shape)} is a ${type}`);

							geometry(shape, Boolean(strict))
								.forEach((shape) => {
									t.notOk(exec(shape), `${explain(shape)} is not a ${type}`);
								});
						}
						else {
							t.notOk(exec(shape), `${explain(shape)} is not a ${type}`);
						}
					});
				}

				t.end();
			});
		});
}
