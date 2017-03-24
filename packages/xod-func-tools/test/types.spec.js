import { assert } from 'chai';
import R from 'ramda';

import { def } from '../src/index';

describe('Map Type', () => {
  it('without nested Maps', () => {
    const testFn = def(
      't :: Map String Number -> [Number]',
      R.values
    );
    const result = testFn({ a: 1, b: 2 });
    assert.sameMembers(result, [1, 2]);
  });
  it('with nested Maps', () => {
    const testFn = def(
      't :: Map String (Map String Number) -> [[Number]]',
      R.compose(
        R.map(R.values),
        R.values
      )
    );
    const result = testFn({ a: { b: 0, c: 1 }, d: { e: 2, f: 3 } });
    assert.sameDeepMembers(result, [[0, 1], [2, 3]]);
  });
});

describe('Pair Type', () => {
  it('without nested Pairs', () => {
    const testFn = def(
      't :: Pair String Number -> String',
      pair => `${pair[0]}_${pair[1]}`
    );
    const result = testFn(['abc', 32]);
    assert.equal(result, 'abc_32');
  });
  it('with nested Pairs', () => {
    const testFn = def(
      't :: Pair String (Pair Number Number) -> String',
      pair => `${pair[0]}_${(pair[1][0] * pair[1][1])}`
    );
    const result = testFn(['abc', [2, 7]]);
    assert.equal(result, 'abc_14');
  });
});
