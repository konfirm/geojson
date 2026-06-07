#!/usr/bin/env node
/**
 * Generates all Italy-related test data files exclusively from OpenStreetMap
 * via the Nominatim lookup API.
 *
 * Source:  © OpenStreetMap contributors (https://www.openstreetmap.org)
 * License: Open Data Commons Open Database License (ODbL)
 *          https://opendatacommons.org/licenses/odbl/
 *
 * All data is RFC 7946-compliant (CCW exterior rings, CW holes).
 *
 * Verify any feature yourself:
 *   https://nominatim.openstreetmap.org/lookup?osm_ids=R<id>&format=json&polygon_geojson=1
 *
 * Usage:
 *   node scripts/update-osm-italy-test-data.mjs
 */

import { get } from 'node:https';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Simplification tolerance in degrees. Tuned per-feature to their physical size.
// 0.00001 → 1.1m  (~0.00km)
// 0.0001 → 11.1m  (~0.01km)
// 0.00012 → 13.4m  (~0.01km)
// 0.001 → 111.3m  (~0.11km)
// 0.005 → 556.6m  (~0.56km)
// 0.01 → 1113.2m  (~1.11km)
const FEATURES = [
	{
		name:      'Holy See',
		osmId:     36989,
		outFile:   'HolySee',
		imports:   `import { Feature, LineString, MultiPoint, Polygon } from '../../source/main';`,
		threshold: 0.00012,  // ~13m — Vatican ~500m wide
	},
	{
		name:      'San Marino',
		osmId:     54624,
		outFile:   'SanMarino',
		imports:   `import { Feature, MultiPoint, Polygon } from '../../source/main';`,
		threshold: 0.0001, // ~11m — San Marino ~12km wide
	},
	{
		name:      'Italy',
		osmId:     365331,
		outFile:   'Italy',
		imports:   `import { Feature, MultiPolygon } from '../../source/main';`,
		threshold: 0.005,   // ~560m — Italy ~1200km tall; holes (enclaves) stay sufficient
	},
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fetchOsm(osmId, threshold) {
	const url = `https://nominatim.openstreetmap.org/lookup?osm_ids=R${osmId}&format=json&polygon_geojson=1&polygon_threshold=${threshold}`;
	return new Promise((resolve, reject) => {
		const options = { headers: { 'User-Agent': '@konfirm/geojson test-data updater (https://github.com/konfirm/geojson)' } };
		get(url, options, (res) => {
			const chunks = [];
			res.on('data', (c) => chunks.push(c));
			res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
			res.on('error', reject);
		}).on('error', reject);
	});
}

function shoelace(ring) {
	const n = ring.length;
	return ring.reduce((s, [x, y], i) => s + x * ring[(i + 1) % n][1] - ring[(i + 1) % n][0] * y, 0);
}

function ensureCCW(ring) {
	if (shoelace(ring) < 0) ring.reverse();
	return ring;
}

function formatCoords(coords, depth = 0) {
	const pad = '\t'.repeat(depth);
	if (typeof coords[0] === 'number') return `[${coords.join(', ')}]`;
	const inner = coords.map((c) => `${pad}\t${formatCoords(c, depth + 1)}`).join(',\n');
	return `[\n${inner}\n${pad}]`;
}

function prov(osmId, name, type) {
	return [
		`// Source: © OpenStreetMap contributors — https://www.openstreetmap.org/relation/${osmId}`,
		`// License: ODbL — https://opendatacommons.org/licenses/odbl/`,
		`// Verify: https://nominatim.openstreetmap.org/lookup?osm_ids=R${osmId}&format=json&polygon_geojson=1`,
		`// Feature: ${name} — geometry: ${type} — winding: RFC 7946-compliant (CCW exterior, CW holes)`,
	].join('\n');
}

// ── Fetch and write ───────────────────────────────────────────────────────────

for (const feature of FEATURES) {
	console.log(`Fetching ${feature.name} (OSM R${feature.osmId}, threshold ${feature.threshold})…`);
	const result = await fetchOsm(feature.osmId, feature.threshold);
	const item = Array.isArray(result) ? result[0] : result;
	const geom = item.geojson;

	if (!geom) throw new Error(`No geojson in response for ${feature.name}`);

	const isMulti = geom.type === 'MultiPolygon';
	const isPoly  = geom.type === 'Polygon';
	if (!isMulti && !isPoly) throw new Error(`Unexpected geometry type ${geom.type} for ${feature.name}`);

	if (isPoly) {
		const ring = geom.coordinates[0];
		ensureCCW(ring);
		console.log(`  ${ring.length} pts, winding: CCW`);

		const open = ring.slice(0, -1);
		let out = `${feature.imports}\n\n${prov(feature.osmId, feature.name, geom.type)}\n`;
		out += `export const coordinates: MultiPoint['coordinates'] = ${formatCoords(open)};\n`;
		if (feature.outFile === 'HolySee') {
			out += `export const multipoint: MultiPoint = {\n\ttype: 'MultiPoint',\n\tcoordinates,\n};\n`;
			out += `export const linestring: LineString = {\n\ttype: 'LineString',\n\tcoordinates,\n};\n`;
		}
		out += `export const polygon: Polygon = {\n\ttype: 'Polygon',\n\tcoordinates: [[...coordinates, coordinates[0]]],\n};\n`;
		out += `export const feature: Feature = {\n\ttype: 'Feature',\n\tproperties: { name: '${feature.name}' },\n\tgeometry: polygon,\n};\n`;
		writeFileSync(join(ROOT, `test/data/${feature.outFile}.ts`), out);

	} else {
		// MultiPolygon — ensure all exterior rings are CCW, all holes are CW
		let totalPts = 0;
		for (const polygon of geom.coordinates) {
			ensureCCW(polygon[0]);
			for (let i = 1; i < polygon.length; i++) {
				if (shoelace(polygon[i]) > 0) polygon[i].reverse(); // holes must be CW
			}
			totalPts += polygon.reduce((s, r) => s + r.length, 0);
		}
		console.log(`  ${geom.coordinates.length} polygons, ${totalPts} total pts`);

		let out = `${feature.imports}\n\n${prov(feature.osmId, feature.name, geom.type)}\n`;
		out += `export const coordinates: MultiPolygon['coordinates'] = ${formatCoords(geom.coordinates)};\n`;
		out += `export const multipolygon: MultiPolygon = {\n\ttype: 'MultiPolygon',\n\tcoordinates,\n};\n`;
		out += `export const feature: Feature = {\n\ttype: 'Feature',\n\tproperties: { name: 'Piazza Pio XII' },\n\tgeometry: { type: 'Point', coordinates: [12.45874285697937, 41.90224110705049] },\n};\n`;
		writeFileSync(join(ROOT, `test/data/${feature.outFile}.ts`), out);
	}

	console.log(`  → test/data/${feature.outFile}.ts`);
}
