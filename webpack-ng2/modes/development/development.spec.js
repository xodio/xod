import {targets} from './development.paths.js';

describe('development target', function() {
  it('path set', function() {
    expect(!!targets.development).toBe(true);
  });
});
