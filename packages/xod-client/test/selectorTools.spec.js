import R from 'ramda';
import { assert } from 'chai';

import { createMemoizedSelector } from '../src/utils/selectorTools';

describe('createMemoizedSelector', () => {
  it('should pass results of dependency selectors as arguments to a main selector function', () => {
    const selector = createMemoizedSelector(
      [R.prop('a'), R.prop('b'), R.prop('c')],
      [R.equals, R.equals, R.equals],
      (a, b, c) => a + b + c
    );

    const state = { a: 1, b: 10, c: 100 };

    assert.equal(111, selector(state));
  });

  it('should memoize result', () => {
    let computations = 0;

    const selector = createMemoizedSelector(
      [R.prop('a'), R.prop('b'), R.prop('c')],
      [R.equals, R.equals, R.equals],
      (a, b, c) => {
        computations += 1;
        return a + b + c;
      }
    );

    const state = { a: 1, b: 10, c: 100 };
    const sameStateNewPointer = { a: 1, b: 10, c: 100 };

    selector(state);
    selector(sameStateNewPointer);

    assert.equal(1, computations);
  });

  it('should recompute result if one of comparators return false', () => {
    let computations = 0;
    const selector = createMemoizedSelector(
      [R.prop('a'), R.prop('b')],
      [R.F, R.F], // will always think that deps changed
      (a, b) => {
        computations += 1;
        return a + b;
      }
    );

    const state = { a: 1, b: 10, c: 100 };

    const timesRunWithSameState = 100;
    R.times(() => selector(state), timesRunWithSameState);

    assert.equal(timesRunWithSameState, computations);
  });

  it('should not recompute result if all comparators return true', () => {
    let computations = 0;
    const selector = createMemoizedSelector(
      [R.prop('a'), R.prop('b')],
      [R.T, R.T],
      (a, b) => {
        computations += 1;
        return a + b;
      }
    );

    const state = { a: 1, b: 10, c: 100 };

    const res1 = selector(state);
    assert.equal(11, res1);

    const res2 = selector(R.assoc('a', 'new a', state));
    assert.equal(res1, res2);

    const res3 = selector(R.assoc('b', 'new b', state));
    assert.equal(res1, res3);

    assert.equal(1, computations);
  });
});
