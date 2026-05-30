import type { GeoJSON } from '../GeoJSON/GeoJSON';
import type { Point } from '../GeoJSON/Geometry/Point';
import { SimpleGeometryIterator } from '../Iterator/SimpleGeometry';

export type Box = [minLon: number, minLat: number, maxLon: number, maxLat: number];

function* positions(coordinates: unknown[]): Generator<Point['coordinates']> {
	if (typeof coordinates[0] === 'number') {
		yield coordinates as Point['coordinates'];
	} else {
		for (const child of coordinates as unknown[][]) {
			yield* positions(child);
		}
	}
}

function boxFromPositions(source: Iterable<Point['coordinates']>): Box {
	let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;

	for (const [lon, lat] of source) {
		if (lon < minLon) minLon = lon;
		if (lat < minLat) minLat = lat;
		if (lon > maxLon) maxLon = lon;
		if (lat > maxLat) maxLat = lat;
	}

	return [minLon, minLat, maxLon, maxLat];
}

export function createBoxFromCoordinates(coordinates: unknown[]): Box {
	return boxFromPositions(positions(coordinates));
}

export function createBox(shape: GeoJSON): Box {
	return boxFromPositions(
		(function* () {
			for (const geometry of new SimpleGeometryIterator(shape)) {
				yield* positions((geometry as unknown as { coordinates: unknown[] }).coordinates);
			}
		})(),
	);
}

export function isWithinBox([lon, lat]: Point['coordinates'], [minLon, minLat, maxLon, maxLat]: Box): boolean {
	return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
}
