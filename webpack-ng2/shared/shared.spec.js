import {sources} from './shared.paths.js';
import * as sharedConfig from './shared.js';

describe('project', function() {
  it('path set', function() {
    expect(!!sources).toBe(true);
  });
});

describe('shared config', function() {
  it('should not be empty', function() {
    expect(!!sharedConfig).toBe(true);
  });
});

export default {};
