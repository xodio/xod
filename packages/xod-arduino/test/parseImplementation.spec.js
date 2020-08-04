import fs from 'fs';
import path from 'path';
import { assert } from 'chai';

import parseImplementation from '../src/parseImplementation';

describe('parseImplementation', () => {
  it('extracts code before, inside, and after `defnode`', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-basic.cpp'),
      'utf-8'
    );

    const expected = {
      afterDefnode: '\n// after defnode\n',
      beforeDefnode: '// before defnode\n',
      insideDefnode: '\n  // inside defnode\n',
      nodetypes: '',
    };
    assert.deepEqual(parseImplementation(fixture), expected);
  });
  it('also extracts nodetypes', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-with-nodetypes.cpp'),
      'utf-8'
    );

    const expected = {
      afterDefnode: '\n// after defnode\n',
      beforeDefnode: '// before\n\n// between nodetypes and defnode\n',
      insideDefnode: '\n  // inside defnode\n',
      nodetypes: '\n  // inside nodetypes\n',
    };
    assert.deepEqual(parseImplementation(fixture), expected);
  });
});
