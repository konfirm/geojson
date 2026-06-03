/**
 * Streams GeodTest.dat and compares cartesian / haversine / vincenty / karney
 * for accuracy (vs. file s12 ground truth) and performance across six distance bands.
 *
 * Outputs two Markdown tables ready to paste into the README.
 *
 * Data source: https://geographiclib.sourceforge.io/C++/doc/geodtest.html
 * Input search order: ./GeodTest.dat → ./GeodTest.dat.gz → remote SourceForge URL
 *
 * Usage:
 *   npm run compare:formulas
 */
import { createReadStream, existsSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import {
	getDistanceOfPointToPoint,
	type PointToPointCalculation,
} from '../source/Domain/Utility/Calculate';

const LOCAL_DAT = 'GeodTest.dat';
const LOCAL_GZ = 'GeodTest.dat.gz';
const REMOTE =
	'https://sourceforge.net/projects/geographiclib/files/testdata/GeodTest.dat.gz/download';

const CATEGORIES = [
	{ name: 'random',               lastLine: 100_000 },
	{ name: 'near-antipodal',       lastLine: 150_000 },
	{ name: 'short',                lastLine: 200_000 },
	{ name: 'near-pole',            lastLine: 250_000 },
	{ name: 'at-pole',              lastLine: 300_000 },
	{ name: 'nearly-meridional',    lastLine: 350_000 },
	{ name: 'nearly-equatorial',    lastLine: 400_000 },
	{ name: 'along-equator',        lastLine: 450_000 },
	{ name: 'antipodal-equatorial', lastLine: Infinity },
] as const;

const ANTIPODAL_CATEGORIES = new Set<string>(['near-antipodal', 'antipodal-equatorial']);

const FORMULAS = ['cartesian', 'haversine', 'vincenty', 'karney'] as const satisfies ReadonlyArray<
	Extract<PointToPointCalculation, string>
>;

type Formula = (typeof FORMULAS)[number];

const DISTANCE_BANDS = [
	{ name: '<1 km',        maxM: 1_000 },
	{ name: '<100 km',      maxM: 100_000 },
	{ name: '<1 000 km',    maxM: 1_000_000 },
	{ name: '<10 000 km',   maxM: 10_000_000 },
	{ name: '>10 000 km',   maxM: Infinity },
] as const;

type BandName = (typeof DISTANCE_BANDS)[number]['name'] | 'near-antipodal';

const ALL_BANDS: ReadonlyArray<BandName> = [
	...DISTANCE_BANDS.map((b) => b.name),
	'near-antipodal',
];

type Stats = {
	count: number;
	maxErr: number;
	sumErr: number;
	sumTimeMs: number;
	throws: number;
};

type AllStats = Record<BandName, Record<Formula, Stats>>;

function emptyStats(): Stats {
	return { count: 0, maxErr: 0, sumErr: 0, sumTimeMs: 0, throws: 0 };
}

function initStats(): AllStats {
	return Object.fromEntries(
		ALL_BANDS.map((name) => [
			name,
			Object.fromEntries(FORMULAS.map((f) => [f, emptyStats()])),
		]),
	) as AllStats;
}

async function openLines(): Promise<ReturnType<typeof createInterface>> {
	if (existsSync(LOCAL_DAT)) {
		process.stderr.write(`Using local ${LOCAL_DAT}\n`);
		return createInterface({ input: createReadStream(LOCAL_DAT), crlfDelay: Infinity });
	}
	if (existsSync(LOCAL_GZ)) {
		process.stderr.write(`Using local ${LOCAL_GZ}\n`);
		return createInterface({
			input: createReadStream(LOCAL_GZ).pipe(createGunzip()),
			crlfDelay: Infinity,
		});
	}
	process.stderr.write(`Streaming from ${REMOTE}\n`);
	const res = await fetch(REMOTE);
	if (!res.ok || !res.body) throw new Error(`Failed to fetch GeodTest.dat: HTTP ${res.status}`);
	return createInterface({
		input: Readable.fromWeb(
			res.body as Parameters<typeof Readable.fromWeb>[0],
		).pipe(createGunzip()),
		crlfDelay: Infinity,
	});
}

async function* streamByCategory(
	lineStream: AsyncIterable<string>,
	categories: typeof CATEGORIES,
): AsyncGenerator<{ name: string; lines: AsyncGenerator<string> }> {
	const sorted = [...categories].sort((a, b) => a.lastLine - b.lastLine);
	const iter = lineStream[Symbol.asyncIterator]();
	let lineNo = 0;
	let done = false;

	for (const { name, lastLine } of sorted) {
		yield {
			name,
			lines: (async function* () {
				while (lineNo < lastLine) {
					const result = await iter.next();
					if (result.done) { done = true; return; }
					lineNo++;
					yield result.value;
				}
			})(),
		};
		while (!done && lineNo < lastLine) {
			const result = await iter.next();
			if (result.done) { done = true; break; }
			lineNo++;
		}
	}
}

function bandForS12(s12: number): BandName {
	for (const { name, maxM } of DISTANCE_BANDS) {
		if (s12 < maxM) return name;
	}
	return '>10 000 km';
}

function fmtErr(m: number): string {
	if (m < 0.001)   return `${(m * 1_000).toFixed(2)} mm`;
	if (m < 1)       return `${m.toFixed(3)} m`;
	if (m < 1_000)   return `${m.toFixed(1)} m`;
	if (m < 1_000_000) return `${(m / 1_000).toFixed(1)} km`;
	return `${(m / 1_000_000).toFixed(0)} Mm`;
}

function fmtTime(ms: number, n: number): string {
	if (n === 0) return '—';
	const us = (ms / n) * 1_000;
	return us < 10 ? `${us.toFixed(2)} µs` : `${us.toFixed(1)} µs`;
}

function printTable(
	title: string,
	rowFn: (band: BandName, formula: Formula, s: Stats) => string,
	allStats: AllStats,
) {
	const cols = FORMULAS.length;
	const divider = `|${['---'].concat(Array(cols).fill('---')).join('|')}|`;

	console.log(`#### ${title}\n`);
	console.log(`| Band | ${FORMULAS.join(' | ')} |`);
	console.log(divider);

	for (const band of ALL_BANDS) {
		const cells = FORMULAS.map((f) => rowFn(band, f, allStats[band][f]));
		console.log(`| ${band} | ${cells.join(' | ')} |`);
	}

	console.log();
}

async function main() {
	const allStats = initStats();
	const rl = await openLines();

	for await (const { name: category, lines } of streamByCategory(rl, CATEGORIES)) {
		process.stderr.write(`Processing ${category}...\n`);
		const antipodal = ANTIPODAL_CATEGORIES.has(category);

		for await (const line of lines) {
			const cols = line.trim().split(/\s+/);
			if (cols.length < 7) continue;

			const lat1 = Number(cols[0]);
			const lon1 = Number(cols[1]);
			const lat2 = Number(cols[3]);
			const lon2 = Number(cols[4]);
			const s12  = Number(cols[6]);

			const a: [number, number] = [lon1, lat1];
			const b: [number, number] = [lon2, lat2];
			const band = antipodal ? 'near-antipodal' : bandForS12(s12);

			for (const formula of FORMULAS) {
				const s = allStats[band][formula];
				const t0 = performance.now();
				let result: number;
				try {
					result = getDistanceOfPointToPoint(a, b, formula);
				} catch {
					s.throws++;
					s.count++;
					continue;
				}
				s.sumTimeMs += performance.now() - t0;
				const err = Math.abs(result - s12);
				if (err > s.maxErr) s.maxErr = err;
				s.sumErr += err;
				s.count++;
			}
		}
	}

	process.stderr.write('Done. Writing tables...\n\n');

	printTable(
		'Accuracy — mean / max error vs. GeographicLib ground truth',
		(band, formula, s) => {
			const ok = s.count - s.throws;
			if (s.count === 0) return '—';
			if (ok === 0) return '**throws**';
			const acc = `${fmtErr(s.sumErr / ok)} / ${fmtErr(s.maxErr)}`;
			if (s.throws === 0) return acc;
			const throwPct = ((s.throws / s.count) * 100).toFixed(0);
			return `${throwPct}% throw; ${acc}`;
		},
		allStats,
	);

	printTable(
		'Performance — mean µs per call',
		(_, formula, s) => {
			const ok = s.count - s.throws;
			if (s.count === 0) return '—';
			if (ok === 0) return '**throws**';
			return fmtTime(s.sumTimeMs, ok);
		},
		allStats,
	);
}

main().catch((err) => {
	process.stderr.write(`Error: ${err}\n`);
	process.exit(1);
});
