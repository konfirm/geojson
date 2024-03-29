import test from 'tape';
import { each } from 'template-literal-each';
import * as Export from '../../../source/Domain/Utility/Winding';
import { exported } from '../../helper/geometry';

exported('Domain/Utility/Winding', Export, 'isClockwiseWinding', 'isCounterClockwiseWinding');

const { isClockwiseWinding, isCounterClockwiseWinding } = Export;

test('Domain/Utility/Winding - isClockwiseWinding', (t) => {
	each`
		position                                    | valid
		--------------------------------------------|-------
		${[[0, 0], [1, 0]]}                         | yes
		${[[0, 0], [1, 0], [1, 1]]}                 | yes
		${[[0, 0], [1, 0], [1, 1], [0, 1]]}         | yes
		${[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]} | yes
		${[[0, 0], [1, 0], [0, 1], [1, 1]]}         | yes
		${[[0, 0]]}                                 | yes
		${[[0, 0], [0, 1]]}                         | yes
		${[[0, 0], [0, 1], [1, 1]]}                 | no
		${[[0, 0], [0, 1], [1, 1], [1, 0]]}         | no
		${[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]} | no
		${[[1, 1], [0, 1], [1, 0], [0, 0]]}         | yes
	`(({ position, valid }) => {
		t.equal(isClockwiseWinding(position), valid === 'yes', `isClockwiseWinding ${JSON.stringify(position)} ${valid}`);
	});

	t.end();
});

test('Domain/Utility/Winding - isCounterClockwiseWinding', (t) => {
	each`
		position                                    | valid
		--------------------------------------------|-------
		${[[0, 0], [1, 0]]}                         | yes
		${[[0, 0], [1, 0], [1, 1]]}                 | no
		${[[0, 0], [1, 0], [1, 1], [0, 1]]}         | no
		${[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]} | no
		${[[0, 0], [1, 0], [0, 1], [1, 1]]}         | yes
		${[[0, 0]]}                                 | yes
		${[[0, 0], [0, 1]]}                         | yes
		${[[0, 0], [0, 1], [1, 1]]}                 | yes
		${[[0, 0], [0, 1], [1, 1], [1, 0]]}         | yes
		${[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]} | yes
		${[[1, 1], [0, 1], [1, 0], [0, 0]]}         | yes
	`(({ position, valid }) => {
		t.equal(isCounterClockwiseWinding(position), valid === 'yes', `isCounterClockwiseWinding ${JSON.stringify(position)} ${valid}`);
	});

	t.end();
});
