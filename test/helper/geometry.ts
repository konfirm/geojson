export function exported(test, group, exports, ...expect: Array<string>) {
	test(`${group} - exports`, (t) => {
		t.deepEqual(Object.keys(exports), expect, `exports ${expect.join(', ')}`);
		expect.forEach((key) => {
			t.equal(typeof exports[key], 'function', `${key} is a function`);
		});

		t.end();
	});
}
