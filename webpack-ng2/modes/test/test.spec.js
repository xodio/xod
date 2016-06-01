import {targets} from './test.paths.js';

describe('development target', function() {
  it('path set', function() {
    expect(!!targets.test).toBe(true);
  });
});
