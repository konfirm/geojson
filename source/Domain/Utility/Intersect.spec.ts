import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { each } from 'template-literal-each';
import { explain, type Improbability } from '../../../test/helper/spec';
import type { LineString, Point, Polygon } from '../../main';
import { intersect } from './Intersect';

describe('intersect', () => {
	describe('point and polygon', () => {
		const box: Polygon = {
			type: 'Polygon',
			coordinates: [
				[
					[0, 0],
					[0, 2],
					[2, 2],
					[2, 0],
					[0, 0],
				],
			],
		};

		test('point inside polygon intersects', () => {
			const inside: Point = { type: 'Point', coordinates: [1, 1] };
			assert.ok(intersect(inside, box));
			assert.ok(intersect(box, inside)); // symmetric
		});
		test('point outside polygon does not intersect', () => {
			assert.ok(!intersect({ type: 'Point', coordinates: [3, 3] }, box));
		});
		test('point on the boundary intersects', () => {
			assert.ok(intersect({ type: 'Point', coordinates: [0, 0] }, box));
		});

		describe('boundary option', () => {
			const vertex: Point = { type: 'Point', coordinates: [0, 0] };
			const onEdge: Point = { type: 'Point', coordinates: [1, 0] };
			const inside: Point = { type: 'Point', coordinates: [1, 1] };
			const outside: Point = { type: 'Point', coordinates: [3, 3] };

			test('defaults to including boundary points, unchanged', () => {
				assert.ok(intersect(vertex, box));
				assert.ok(intersect(onEdge, box));
			});

			test("'include' behaves the same as the default", () => {
				assert.ok(intersect(vertex, box, { boundary: 'include' }));
				assert.ok(intersect(onEdge, box, { boundary: 'include' }));
			});

			test("'exclude' excludes vertex and edge boundary points", () => {
				assert.ok(!intersect(vertex, box, { boundary: 'exclude' }));
				assert.ok(!intersect(onEdge, box, { boundary: 'exclude' }));
			});

			test('interior and exterior points are unaffected by the option', () => {
				assert.ok(intersect(inside, box, { boundary: 'exclude' }));
				assert.ok(!intersect(outside, box, { boundary: 'exclude' }));
			});

			test('a custom function decides boundary inclusion', () => {
				assert.ok(!intersect(vertex, box, { boundary: () => false }));
				assert.ok(intersect(vertex, box, { boundary: () => true }));
			});

			test('holes respect the same boundary option as the exterior ring', () => {
				const withHole: Polygon = {
					type: 'Polygon',
					coordinates: [
						box.coordinates[0],
						[
							[0.5, 0.5],
							[0.5, 1.5],
							[1.5, 1.5],
							[1.5, 0.5],
							[0.5, 0.5],
						],
					],
				};
				const onHoleEdge: Point = {
					type: 'Point',
					coordinates: [1, 0.5],
				};

				assert.ok(
					!intersect(onHoleEdge, withHole),
					'default: hole boundary counts as hole, so excluded from the surface',
				);
				assert.ok(
					intersect(onHoleEdge, withHole, { boundary: 'exclude' }),
					"'exclude': hole boundary no longer counts as hole, so included in the surface",
				);
			});

			describe("'winding' — top-left rule", () => {
				// box: [0,0] -> [0,2] -> [2,2] -> [2,0] -> [0,0] (CCW)
				// edges: west (north-heading, exclusive), north (east-heading, inclusive),
				// east (south-heading, inclusive), south (west-heading, exclusive)
				test('vertices where both incident edges agree are unambiguous', () => {
					assert.ok(
						!intersect(
							{ type: 'Point', coordinates: [0, 0] },
							box,
							{
								boundary: 'winding',
							},
						),
						'(0,0): both incident edges exclusive',
					);
					assert.ok(
						intersect({ type: 'Point', coordinates: [2, 2] }, box, {
							boundary: 'winding',
						}),
						'(2,2): both incident edges inclusive',
					);
				});

				test('a vertex where incident edges disagree requires both to be inclusive', () => {
					assert.ok(
						!intersect(
							{ type: 'Point', coordinates: [0, 2] },
							box,
							{
								boundary: 'winding',
							},
						),
						'(0,2): west edge exclusive, north edge inclusive -> excluded',
					);
					assert.ok(
						!intersect(
							{ type: 'Point', coordinates: [2, 0] },
							box,
							{
								boundary: 'winding',
							},
						),
						'(2,0): east edge inclusive, south edge exclusive -> excluded',
					);
				});

				test('mid-edge points follow their own edge only', () => {
					assert.ok(
						intersect({ type: 'Point', coordinates: [1, 2] }, box, {
							boundary: 'winding',
						}),
						'north edge (east-heading): inclusive',
					);
					assert.ok(
						!intersect(
							{ type: 'Point', coordinates: [1, 0] },
							box,
							{
								boundary: 'winding',
							},
						),
						'south edge (west-heading): exclusive',
					);
				});

				test('reversing the ring flips every boundary answer', () => {
					const reversed: Polygon = {
						type: 'Polygon',
						coordinates: [[...box.coordinates[0]].reverse()],
					};

					each`
						point
						-------------
						${[0, 0]}
						${[2, 2]}
						${[1, 2]}
						${[1, 0]}
					`(({ point }: { point: [number, number] }) => {
						const forward = intersect(
							{ type: 'Point', coordinates: point },
							box,
							{ boundary: 'winding' },
						);
						const flipped = intersect(
							{ type: 'Point', coordinates: point },
							reversed,
							{ boundary: 'winding' },
						);

						assert.notStrictEqual(
							forward,
							flipped,
							`${explain(point)} should flip when the ring reverses`,
						);
					});
				});
			});
		});
	});

	describe('line strings', () => {
		test('crossing lines intersect', () => {
			const a: LineString = {
				type: 'LineString',
				coordinates: [
					[0, 0],
					[2, 2],
				],
			};
			const b: LineString = {
				type: 'LineString',
				coordinates: [
					[0, 2],
					[2, 0],
				],
			};
			assert.ok(intersect(a, b));
		});
		test('parallel lines do not intersect', () => {
			const a: LineString = {
				type: 'LineString',
				coordinates: [
					[0, 0],
					[2, 0],
				],
			};
			const b: LineString = {
				type: 'LineString',
				coordinates: [
					[0, 1],
					[2, 1],
				],
			};
			assert.ok(!intersect(a, b));
		});

		test('collinear, overlapping lines intersect (issue #30)', () => {
			const a: LineString = {
				type: 'LineString',
				coordinates: [
					[5.8950000000000005, 51.995],
					[5.905, 52.004999999999995],
				],
			};
			const b: LineString = {
				type: 'LineString',
				coordinates: [
					[5.9, 52],
					[6.9, 53],
				],
			};
			assert.ok(intersect(a, b));
			assert.ok(intersect(b, a));
		});
	});

	describe('geometry crossing the antimeridian', () => {
		test('a dateline-hopping line does not falsely intersect a distant meridian, in both argument orders', () => {
			// a short hop across the dateline; b sits at lon=0, nowhere near it
			const a: LineString = {
				type: 'LineString',
				coordinates: [
					[179, -1],
					[-179, 1],
				],
			};
			const b: LineString = {
				type: 'LineString',
				coordinates: [
					[0, -1],
					[0, 1],
				],
			};

			assert.ok(!intersect(a, b));
			assert.ok(!intersect(b, a));
		});

		test('a point inside a dateline-straddling polygon intersects it', () => {
			const box: Polygon = {
				type: 'Polygon',
				coordinates: [
					[
						[179, 0],
						[-179, 0],
						[-179, 2],
						[179, 2],
						[179, 0],
					],
				],
			};
			assert.ok(intersect({ type: 'Point', coordinates: [180, 1] }, box));
			assert.ok(!intersect({ type: 'Point', coordinates: [0, 1] }, box));
		});
	});

	describe('unknown geometry types', () => {
		test('returns false for unrecognised types', () => {
			const unknown = {
				type: 'Unknown',
				coordinates: [0, 0],
			} as Improbability;
			assert.ok(
				!intersect(unknown, { type: 'Point', coordinates: [0, 0] }),
			);
			assert.ok(
				!intersect({ type: 'Point', coordinates: [0, 0] }, unknown),
			);
		});
	});

	describe('large/ambiguous ring (issue #18 wiring check)', () => {
		// Not a correctness suite — that lives in Spherical.spec.ts against
		// isPositionInSphericalRing directly. Just confirms intersect()
		// still wires down to it correctly for a ring spanning most of the
		// globe, where flat-plane ray-casting used to invert the answer.
		const ring: Polygon = {
			type: 'Polygon',
			coordinates: [
				[
					[-180, -1],
					[-120, -1],
					[-60, -1],
					[0, -1],
					[60, -1],
					[120, -1],
					[-180, -1],
				],
			],
		};

		test('point in the smaller (south) cap intersects', () => {
			assert.ok(
				intersect({ type: 'Point', coordinates: [90, -45] }, ring),
			);
		});
		test('point in the larger (north) cap does not intersect', () => {
			assert.ok(
				!intersect({ type: 'Point', coordinates: [90, 45] }, ring),
			);
		});
	});

	describe('band ring closed by vertical edges (issue #22 wiring check)', () => {
		// Not a correctness suite — that lives in Spherical.spec.ts against
		// isPositionInSphericalRing directly. Just confirms intersect() still
		// wires down to it correctly for a ring shaped like a wide latitude
		// band (not a full 360-degree circle), where a vertex-centroid
		// heuristic used to pick the larger region as "inside".
		//
		// Needs the same dense-vertex construction as the correctness suite:
		// a geodesic edge between two far-apart same-latitude points cuts
		// straight across (toward the pole), it doesn't follow the parallel —
		// a coarse 4-vertex rectangle would silently test a different shape.
		function parallel(
			lat: number,
			lonFrom: number,
			lonTo: number,
			step: number,
		) {
			const points: Array<[number, number]> = [];
			const dir = lonTo >= lonFrom ? step : -step;
			for (
				let lon = lonFrom;
				dir > 0 ? lon <= lonTo : lon >= lonTo;
				lon += dir
			)
				points.push([lon, lat]);
			return points;
		}

		const band = [
			...parallel(-60, -170, 170, 10),
			...parallel(60, 170, -170, 10),
		];
		const ring: Polygon = {
			type: 'Polygon',
			coordinates: [[...band, band[0]]],
		};

		test('point deep in the band does not intersect', () => {
			assert.ok(!intersect({ type: 'Point', coordinates: [0, 0] }, ring));
		});
		test('point deep in the polar cap intersects', () => {
			assert.ok(
				intersect({ type: 'Point', coordinates: [45, 75] }, ring),
			);
		});
	});

	describe('degenerate ring: all vertices coincide (issue #27 wiring check)', () => {
		// Not a correctness suite — that lives in Spherical.spec.ts/
		// Calculate.spec.ts. Just confirms intersect() wires down correctly
		// for a ring collapsed to a single coincident point (e.g. a legacy
		// $box query with equal corners), which used to match every point
		// tested against it.
		const ring: Polygon = {
			type: 'Polygon',
			coordinates: [
				[
					[5.9, 52],
					[5.9, 52],
					[5.9, 52],
					[5.9, 52],
					[5.9, 52],
				],
			],
		};

		test('the exact coincident point intersects', () => {
			assert.ok(
				intersect({ type: 'Point', coordinates: [5.9, 52] }, ring),
			);
		});

		test('a point nowhere near it does not intersect', () => {
			assert.ok(
				!intersect({ type: 'Point', coordinates: [10.9, 57] }, ring),
			);
		});
	});

	describe('partially degenerate ring: one vertex listed twice in a row (issue #29 wiring check)', () => {
		// Not a correctness suite — that lives in Spherical.spec.ts/
		// Calculate.spec.ts. Just confirms intersect() wires down correctly
		// for a ring with a real (>=3 distinct vertices) shape that still
		// has one zero-length edge, which used to be treated as if the
		// whole ring were degenerate (like #27) instead of just that edge.
		const withDupe: Polygon = {
			type: 'Polygon',
			coordinates: [
				[
					[5.9, 52],
					[5.9, 52],
					[6.9, 52],
					[6.9, 53],
					[5.9, 52],
				],
			],
		};

		test('a point far from the triangle does not intersect', () => {
			assert.ok(
				!intersect(
					{ type: 'Point', coordinates: [25.9, 72] },
					withDupe,
				),
			);
		});

		test('a point genuinely inside the triangle intersects', () => {
			assert.ok(
				intersect(
					{ type: 'Point', coordinates: [5.905, 52.005] },
					withDupe,
				),
			);
		});
	});

	describe('LineString touching a Polygon boundary (issue #31)', () => {
		// lon 4.9-6.9, lat 51-53
		const polygon: Polygon = {
			type: 'Polygon',
			coordinates: [
				[
					[4.9, 51],
					[6.9, 51],
					[6.9, 53],
					[4.9, 53],
					[4.9, 51],
				],
			],
		};
		const line = (
			coordinates: [[number, number], [number, number]],
		): LineString => ({ type: 'LineString', coordinates });

		test('touching a vertex and immediately leaving does not intersect, in both directions', () => {
			assert.ok(
				!intersect(
					line([
						[6.9, 53],
						[6.91, 53.01],
					]),
					polygon,
				),
			);
			assert.ok(
				!intersect(
					line([
						[6.91, 53.01],
						[6.9, 53],
					]),
					polygon,
				),
			);
		});

		test('entering through that same vertex intersects, in both directions', () => {
			assert.ok(
				intersect(
					line([
						[6.91, 53.01],
						[6.7, 52.8],
					]),
					polygon,
				),
			);
			assert.ok(
				intersect(
					line([
						[6.7, 52.8],
						[6.91, 53.01],
					]),
					polygon,
				),
			);
		});

		test('touching a mid-edge point (not a vertex) and leaving does not intersect', () => {
			assert.ok(
				!intersect(
					line([
						[4.9, 52],
						[4.5, 52.5],
					]),
					polygon,
				),
			);
		});

		test('touching a mid-edge point and entering intersects', () => {
			assert.ok(
				intersect(
					line([
						[4.9, 52],
						[5.5, 52.2],
					]),
					polygon,
				),
			);
		});

		test('a proper pass-through crossing (neither endpoint touching or interior) intersects', () => {
			assert.ok(
				intersect(
					line([
						[5.9, 50.9],
						[5.9, 53.1],
					]),
					polygon,
				),
			);
		});

		test('running along a full edge, vertex to vertex, intersects', () => {
			assert.ok(
				intersect(
					line([
						[6.9, 51],
						[6.9, 53],
					]),
					polygon,
				),
			);
		});

		test('starting at a vertex and running partway along an edge intersects', () => {
			assert.ok(
				intersect(
					line([
						[6.9, 53],
						[5.9, 53],
					]),
					polygon,
				),
			);
		});

		test('a fully contained line intersects', () => {
			assert.ok(
				intersect(
					line([
						[5.5, 51.5],
						[6, 52],
					]),
					polygon,
				),
			);
		});

		test('entirely outside, no touch, does not intersect', () => {
			assert.ok(
				!intersect(
					line([
						[10, 10],
						[11, 11],
					]),
					polygon,
				),
			);
		});

		test('a multi-segment line dipping into the interior between two outside vertices intersects', () => {
			const dipping: LineString = {
				type: 'LineString',
				coordinates: [
					[3, 52],
					[5.9, 52],
					[8, 52],
				],
			};
			assert.ok(intersect(dipping, polygon));
		});
	});
});
