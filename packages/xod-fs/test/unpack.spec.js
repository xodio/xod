import { assert } from 'chai';

import simpleProject from './fixtures/simple-project.json';
import simpleProjectSplit from './fixtures/simple-project.split.json';

import {
  arrangeByFiles,
} from '../src/unpack';

describe('arrangeByFiles', () => {
  it('should split a project into an array of files described as {path, content}', () => {
    assert.deepEqual(
      arrangeByFiles(simpleProject),
      simpleProjectSplit
    );
  });
});
