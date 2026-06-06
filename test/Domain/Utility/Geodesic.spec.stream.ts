/**
 * Validates karney() against Karney's official GeodTest.dat dataset.
 * Reference: https://geographiclib.sourceforge.io/C++/doc/geodtest.html
 *
 * Data source (500 000 inverse geodesic cases, 86 MB uncompressed):
 *   https://sourceforge.net/projects/geographiclib/files/testdata/GeodTest.dat.gz/download
 *
 * Input search order:
 *   1. ./GeodTest.dat       (local, uncompressed)
 *   2. ./GeodTest.dat.gz    (local, compressed)
 *   3. Remote URL           (streamed + decompressed on the fly)
 *
 * Usage:
 *   npm run test:geodesic
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReadStream, existsSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { karney } from '../../../source/Domain/Utility/Geodesic';
import { vincenty, haversine } from '../../../source/Domain/Utility/Calculate';

const LOCAL_DAT = 'GeodTest.dat';
const LOCAL_GZ = 'GeodTest.dat.gz';
const REMOTE =
	'https://sourceforge.net/projects/geographiclib/files/testdata/GeodTest.dat.gz/download';

const KARNEY_TOLERANCE   = 0.5e-3; // 0.5 mm — conservative given ~15 nm theoretical accuracy
const VINCENTY_TOLERANCE = 1.0e-3; // 1 mm — conservative given ~0.06 mm stated accuracy

const ANTIPODAL = new Set(['near-antipodal', 'antipodal-equatorial']);

// GeodTest.dat line ranges by category (50 k per block except random which is 100 k)
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
];

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
	if (!res.ok || !res.body)
		throw new Error(`Failed to fetch GeodTest.dat: HTTP ${res.status}`);

	const stream = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
	return createInterface({ input: stream.pipe(createGunzip()), crlfDelay: Infinity });
}

type Category = { name: string; lastLine: number };
type CategorySlice = { name: string; startLine: number; lines: AsyncGenerator<string> };

async function* streamByCategory(
	lineStream: AsyncIterable<string>,
	categories: Array<Category>,
): AsyncGenerator<CategorySlice> {
	const sorted = [...categories].sort((a, b) => a.lastLine - b.lastLine);
	const iter = lineStream[Symbol.asyncIterator]();
	let lineNo = 0;
	let streamDone = false;

	for (const { name, lastLine } of sorted) {
		const startLine = lineNo;

		yield {
			name,
			startLine,
			lines: (async function* () {
				while (lineNo < lastLine) {
					const result = await iter.next();
					if (result.done) { streamDone = true; return; }
					lineNo++;
					yield result.value;
				}
			})(),
		};

		// Skip unread lines in case the caller didn't drain the slice
		while (!streamDone && lineNo < lastLine) {
			const result = await iter.next();
			if (result.done) { streamDone = true; break; }
			lineNo++;
		}
	}
}

test('GeodTest.dat', async (t) => {
	const rl = await openLines();

	for await (const { name, lines } of streamByCategory(rl, CATEGORIES)) {
		await t.test(name, async (t) => {
			let count = 0;
			let maxErr = 0;

			for await (const line of lines) {
				const cols = line.trim().split(/\s+/);
				if (cols.length < 7) { ++count; continue; }
				const [lat1, lon1, , lat2, lon2, , expected] = cols.map(Number);
				const actual = karney([lon1, lat1], [lon2, lat2]);
				const delta = Math.abs(actual - expected);

				if (delta > maxErr) maxErr = delta;
				assert.ok(delta < KARNEY_TOLERANCE, `[${lon1}, ${lat1}] -> [${lon2}, ${lat2}] ~= ${expected}, got ${actual} (${delta})`);

				++count;
			}

			t.diagnostic(`${count} cases, max error ${maxErr.toExponential(3)} m`);
		});
	}
});

// Vincenty accuracy is only asserted for geodesics shorter than this — beyond it,
// near-antipodal cases in any category can converge with reduced accuracy or throw.
const VINCENTY_ACCURACY_LIMIT = 15_000_000; // 15 000 km

test('vincenty accuracy — GeodTest.dat', async (t) => {
	const rl = await openLines();

	for await (const { name, lines } of streamByCategory(rl, CATEGORIES)) {
		await t.test(name, async (t) => {
			let count = 0;
			let throws = 0;
			let maxErr = 0;

			for await (const line of lines) {
				const cols = line.trim().split(/\s+/);
				if (cols.length < 7) { ++count; continue; }
				const [lat1, lon1, , lat2, lon2, , expected] = cols.map(Number);

				let actual: number;
				try {
					actual = vincenty([lon1, lat1], [lon2, lat2]);
				} catch (e) {
					if (e instanceof EvalError) { throws++; count++; continue; }
					throw e;
				}

				const delta = Math.abs(actual - expected);
				if (delta > maxErr) maxErr = delta;

				if (expected < VINCENTY_ACCURACY_LIMIT) {
					assert.ok(delta < VINCENTY_TOLERANCE, `[${lon1}, ${lat1}] -> [${lon2}, ${lat2}] ~= ${expected}, got ${actual} (${delta})`);
				}

				++count;
			}

			t.diagnostic(`${count} cases, ${throws} threw, max error ${maxErr.toExponential(3)} m`);
		});
	}
});

test('haversine — GeodTest.dat (spherical approximation, accuracy reported only)', async (t) => {
	const rl = await openLines();

	for await (const { name, lines } of streamByCategory(rl, CATEGORIES)) {
		await t.test(name, async (t) => {
			let count = 0;
			let maxAbsErr = 0;
			let maxRelErr = 0;

			for await (const line of lines) {
				const cols = line.trim().split(/\s+/);
				if (cols.length < 7) { ++count; continue; }
				const [lat1, lon1, , lat2, lon2, , expected] = cols.map(Number);

				const actual = haversine([lon1, lat1], [lon2, lat2]);
				const delta = Math.abs(actual - expected);
				const rel = expected > 0 ? delta / expected : 0;

				if (delta > maxAbsErr) maxAbsErr = delta;
				if (rel > maxRelErr) maxRelErr = rel;

				++count;
			}

			t.diagnostic(`${count} cases, max error ${maxAbsErr.toFixed(1)} m (${(maxRelErr * 100).toFixed(3)}%)`);
		});
	}
});
