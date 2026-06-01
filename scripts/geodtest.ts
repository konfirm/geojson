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
import { createReadStream, existsSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { karney } from '../source/Domain/Utility/Geodesic';

const LOCAL_DAT = 'GeodTest.dat';
const LOCAL_GZ = 'GeodTest.dat.gz';
const REMOTE =
	'https://sourceforge.net/projects/geographiclib/files/testdata/GeodTest.dat.gz/download';

const TOLERANCE = 0.5e-3; // 0.5 mm — conservative given ~15 nm theoretical accuracy

// GeodTest.dat line ranges by category (50 k per block except random which is 100 k)
function category(line: number): string {
	if (line < 100_000) return 'random';
	if (line < 150_000) return 'near-antipodal';
	if (line < 200_000) return 'short';
	if (line < 250_000) return 'near-pole';
	if (line < 300_000) return 'at-pole';
	if (line < 350_000) return 'nearly-meridional';
	if (line < 400_000) return 'nearly-equatorial';
	if (line < 450_000) return 'along-equator';
	return 'antipodal-equatorial';
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
	if (!res.ok || !res.body)
		throw new Error(`Failed to fetch GeodTest.dat: HTTP ${res.status}`);
	const stream = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
	return createInterface({ input: stream.pipe(createGunzip()), crlfDelay: Infinity });
}

type CatStats = { count: number; maxErr: number; failures: number };

async function main(): Promise<void> {
	const rl = await openLines();

	let lineNo = 0;
	let failures = 0;
	let maxError = 0;
	const stats = new Map<string, CatStats>();

	for await (const line of rl) {
		const cols = line.trim().split(/\s+/);
		if (cols.length < 7) {
			lineNo++;
			continue;
		}

		const lat1 = Number(cols[0]);
		const lon1 = Number(cols[1]);
		const lat2 = Number(cols[3]);
		const lon2 = Number(cols[4]);
		const expected = Number(cols[6]);

		const actual = karney([lon1, lat1], [lon2, lat2]);
		const error = Math.abs(actual - expected);

		const cat = category(lineNo);
		if (!stats.has(cat)) stats.set(cat, { count: 0, maxErr: 0, failures: 0 });
		const s = stats.get(cat)!;
		s.count++;
		if (error > s.maxErr) s.maxErr = error;
		if (error > maxError) maxError = error;
		if (error > TOLERANCE) {
			s.failures++;
			failures++;
			if (failures <= 10) {
				process.stderr.write(
					`  FAIL line ${lineNo + 1} [${cat}]: ` +
						`(${lat1},${lon1})→(${lat2},${lon2}) ` +
						`got ${actual.toFixed(6)}, expected ${expected}, ` +
						`error ${error.toExponential(3)} m\n`,
				);
			}
		}

		if ((lineNo + 1) % 50_000 === 0) {
			process.stdout.write(
				`  ${(lineNo + 1).toString().padStart(7)} / 500000` +
					`  max error so far: ${maxError.toExponential(3)} m\n`,
			);
		}

		lineNo++;
	}

	process.stdout.write('\nCategory breakdown:\n');
	for (const [cat, s] of stats) {
		const mark = s.failures === 0 ? '✓' : `✗ ${s.failures} failures`;
		process.stdout.write(
			`  ${mark.padEnd(16)} ${cat.padEnd(24)} ` +
				`${s.count.toString().padStart(6)} cases  ` +
				`max error ${s.maxErr.toExponential(3)} m\n`,
		);
	}

	process.stdout.write(
		`\n${lineNo} cases  max error ${maxError.toExponential(3)} m  failures ${failures}\n`,
	);

	process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
	process.stderr.write(`${err}\n`);
	process.exit(1);
});
