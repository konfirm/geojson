export function explain(value: unknown): string {
	return JSON.stringify(value).replace(/^(.{20}).{3,}(.{20})$/, '$1 … $2');
}
