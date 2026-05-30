// biome-ignore lint/suspicious/noExplicitAny: Improbability is the intentional escape hatch for test assertions that cannot be typed otherwise
export type Improbability = any;

export function explain(value: unknown): string {
	return JSON.stringify(value).replace(/^(.{20}).{3,}(.{20})$/, '$1 … $2');
}
