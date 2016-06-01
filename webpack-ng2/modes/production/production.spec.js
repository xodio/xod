import {targets} from './production.paths.js';

describe('production target', function() {
  it('path set', function() {
    expect(!!targets.production).toBe(true);
  });
});
