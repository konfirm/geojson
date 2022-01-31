export function bounds<T extends number>(a: number, b: number): (value: number) => T {
	const min = Math.min(a, b);
	const max = Math.max(a, b);
	const range = max - min;
	const mod = (value: number): T => value < min ? mod(value + range) : value > max ? mod(value - range) : <T>value;

	return (value: number): T => mod(value) as T;
}
