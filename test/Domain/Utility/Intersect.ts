import test from 'tape';
import { intersect } from '../../../source/Domain/Utility/Intersect';
import { explain } from '../../helper/geometry';
import { shapes } from '../../data/Intersect';

const types = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection', 'Feature', 'FeatureCollection'];
const combo = types.reduce((carry, a) => carry.concat(types.map((b) => [a, b])), [])

combo.forEach(([ta, tb]) => {
	const tests = shapes
		.reduce((carry, { a, b, intersect }) => {
			if (a.type === ta && b.type === tb) {
				return carry.concat({ a, b, intersect });
			}
			if (a.type === tb && b.type === ta) {
				return carry.concat({ a: b, b: a, intersect });
			}

			return carry;
		}, []);
	const hits = tests.filter(({ intersect }) => intersect);
	const miss = tests.filter(({ intersect }) => !intersect);

	test(`Domain/Utility/Intersect - intersect ${ta} with ${tb}`, (t) => {
		hits.forEach(({ a, b }) => {
			t.ok(intersect(a, b), `${explain(a)} intersects with ${explain(b)}`)
		});
		miss.forEach(({ a, b }) => {
			t.notOk(intersect(a, b), `${explain(a)} does not intersect with ${explain(b)}`)
		});

		t.end();
	});
});

test('Domain/Utility/Intersect - intersect Point with empty LineString', (t) => {
	t.notOk(intersect({ type: 'Point', coordinates: [1, 1] }, { type: 'LineString', coordinates: [[0, 0], [0, 0]] }));

	t.end();
});

test(`Domain/Utility/Intersect - intersect invalid GeoJSON types`, (t) => {
	shapes
		.filter(({ a, b }: any) => a.type === 'Impossible' || b.type === 'Impossible')
		.forEach(({ a, b }: any) => {
			t.notOk(intersect(a, b), `${explain(a)} does not intersect with ${explain(b)}`)
		});

	t.end();
});
