import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['source/main.ts'],
	format: ['cjs', 'esm', 'iife'],
	dts: true,
	clean: true,
	sourcemap: true,
	globalName: 'GeoJSON',
});
