/**
 * Streams GeodTest.dat and compares karney / vincenty / haversine / cartesian
 * for accuracy (vs. GeographicLib C++ ground truth) and performance across distance bands.
 *
 * Outputs a single Markdown table: % of cases exceeding the threshold · mean µs/call.
 * Karney is used as the benchmark (max deviation from C++ reference: ~11 nm).
 *
 * Data source: https://geographiclib.sourceforge.io/C++/doc/geodtest.html
 * Input search order: ./GeodTest.dat → ./GeodTest.dat.gz → remote SourceForge URL
 *
 * Usage:
 *   npm run compare:formulas
 *   npm run compare:formulas -- --threshold <metres>   (default: 1)
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

const FORMULAS = ['karney', 'vincenty', 'haversine', 'cartesian'] as const satisfies ReadonlyArray<
	Extract<PointToPointCalculation, string>
>;

type Formula = (typeof FORMULAS)[number];

const DISTANCE_BANDS = [
	{ name: '<1 m',         maxM: 1 },
	{ name: '<10 m',        maxM: 10 },
	{ name: '<100 m',       maxM: 100 },
	{ name: '<1 km',        maxM: 1_000 },
	{ name: '<10 km',       maxM: 10_000 },
	{ name: '<25 km',       maxM: 25_000 },
	{ name: '<50 km',       maxM: 50_000 },
	{ name: '<100 km',      maxM: 100_000 },
	{ name: '<1 000 km',    maxM: 1_000_000 },
	{ name: '<10 000 km',   maxM: 10_000_000 },
	{ name: '<15 000 km',   maxM: 15_000_000 },
	{ name: '>15 000 km',   maxM: Infinity },
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
	exceeds: number;
};

type AllStats = Record<BandName, Record<Formula, Stats>>;

function emptyStats(): Stats {
	return { count: 0, maxErr: 0, sumErr: 0, sumTimeMs: 0, throws: 0, exceeds: 0 };
}

function initStats(): AllStats {
	return Object.fromEntries(
		ALL_BANDS.map((name) => [
			name,
			Object.fromEntries(FORMULAS.map((f) => [f, emptyStats()])),
		]),
	) as AllStats;
}

function parseThreshold(): number {
	const idx = process.argv.indexOf('--threshold');
	if (idx !== -1) {
		const val = Number(process.argv[idx + 1]);
		if (!isNaN(val) && val > 0) return val;
	}
	return 100.0;
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
	return '>15 000 km';
}

function fmtErr(m: number): string {
	if (m < 1e-6)      return `${(m * 1e9).toFixed(0)} nm`;
	if (m < 0.001)     return `${(m * 1_000).toFixed(2)} mm`;
	if (m < 1)         return `${m.toFixed(3)} m`;
	if (m < 1_000)     return `${m.toFixed(1)} m`;
	if (m < 1_000_000) return `${(m / 1_000).toFixed(1)} km`;
	return `${(m / 1_000_000).toFixed(0)} Mm`;
}

function fmtTime(ms: number, n: number): string {
	if (n === 0) return '—';
	const us = (ms / n) * 1_000;
	return us < 10 ? `${us.toFixed(2)} µs` : `${us.toFixed(1)} µs`;
}

const LAST_GOOD_PCT = 5;

function findLastGoodBand(allStats: AllStats, formula: Formula): BandName | null {
	let lastGood: BandName | null = null;
	let anyBad = false;

	for (const band of ALL_BANDS) {
		const s = allStats[band][formula];
		if (s.count === 0) continue;
		const wrongPct = ((s.throws + s.exceeds) / s.count) * 100;
		if (wrongPct <= LAST_GOOD_PCT) {
			lastGood = band;
		} else {
			anyBad = true;
			break;
		}
	}

	return anyBad ? lastGood : null;
}

function fmtCell(s: Stats, karneyStats?: Stats): string {
	const ok = s.count - s.throws;
	if (s.count === 0) return '—';

	const wrong = s.throws + s.exceeds;
	const pct   = wrong === 0
		? 'none'
		: `${((wrong / s.count) * 100).toFixed(1)}%`;

	let speed: string;
	if (!karneyStats || ok === 0) {
		// karney itself, or a formula with no successful calls — show absolute
		speed = fmtTime(s.sumTimeMs, ok);
	} else {
		const karneyOk = karneyStats.count - karneyStats.throws;
		const karneyUs = karneyOk > 0 ? (karneyStats.sumTimeMs / karneyOk) * 1_000 : 0;
		const formulaUs = (s.sumTimeMs / ok) * 1_000;
		const ratio = karneyUs > 0 && formulaUs > 0 ? Math.round(karneyUs / formulaUs) : 0;
		speed = `~${Math.max(1, ratio)}x`;
	}

	return `${pct} · ${speed}`;
}

function printTable(allStats: AllStats, threshold: number) {
	// Karney summary across all bands
	const karneyOk    = ALL_BANDS.reduce((n, b) => n + allStats[b].karney.count - allStats[b].karney.throws, 0);
	const karneySum   = ALL_BANDS.reduce((n, b) => n + allStats[b].karney.sumErr, 0);
	const karneyMax   = Math.max(...ALL_BANDS.map((b) => allStats[b].karney.maxErr));

	const thresholdStr = fmtErr(threshold);

	console.log(`This library's karney implementation matches Karney's own GeographicLib C++ reference within ${fmtErr(karneySum / karneyOk)} on average and ${fmtErr(karneyMax)} at worst, across ${karneyOk.toLocaleString()} test cases — close enough to use as the accuracy benchmark below.`);
	console.log(`A result is counted as **wrong** when it deviates from the benchmark by more than ${thresholdStr}. Throws count as wrong too.`);
	console.log(`Performance: karney shows absolute µs/call on this machine; other formulas show speed relative to karney (~Nx = N times faster) — ratios are more portable across machines than absolute times.`);
	console.log(`Run your own numbers: \`npm run compare:formulas -- --threshold <metres>\` (current: ${threshold} m)\n`);

	const header  = `| band | n | ${FORMULAS.join(' | ')} |`;
	const divider = `| --- | ---: | ${FORMULAS.map(() => '---').join(' | ')} |`;

	const lastGood = Object.fromEntries(
		FORMULAS.map((f) => [f, findLastGoodBand(allStats, f)]),
	) as Record<Formula, BandName | null>;

	console.log(header);
	console.log(divider);

	for (const band of ALL_BANDS) {
		const n     = allStats[band].karney.count;
		const cells = FORMULAS.map((f) => {
			const karneyStats = f === 'karney' ? undefined : allStats[band].karney;
			const cell = fmtCell(allStats[band][f], karneyStats);
			return lastGood[f] === band ? `**${cell}**` : cell;
		});
		console.log(`| ${band} | ${n.toLocaleString()} | ${cells.join(' | ')} |`);
	}

	console.log();
}

async function main() {
	const threshold = parseThreshold();
	const allStats  = initStats();
	const rl        = await openLines();

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
				const s  = allStats[band][formula];
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
				if (err > threshold) s.exceeds++;
				if (err > s.maxErr)  s.maxErr = err;
				s.sumErr += err;
				s.count++;
			}
		}
	}

	process.stderr.write('Done. Writing table...\n\n');

	printTable(allStats, threshold);
}

main().catch((err) => {
	process.stderr.write(`Error: ${err}\n`);
	process.exit(1);
});
