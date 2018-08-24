import { assert } from 'chai';

import { roundTo } from '../src/math';

describe('Math', () => {
  it('roundTo() returns right values', () => {
    assert.equal(roundTo(2, 1.1115), 1.11);
    assert.equal(roundTo(3, 1.1115), 1.112);
    assert.equal(roundTo(4, 1.1115), 1.1115);
    assert.equal(roundTo(4, 1), 1);
    assert.equal(roundTo(10, 47.83941230486833478), 47.8394123049);
  });
});
