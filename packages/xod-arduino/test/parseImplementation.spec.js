import fs from 'fs';
import path from 'path';
import { assert } from 'chai';

import parseImplementation from '../src/parseImplementation';

describe('parseImplementation', () => {
  it('extracts code before, inside, and after node definition', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-basic.cpp'),
      'utf-8'
    );

    const expected = {
      afterNodeDefinition: '\n// after node definition\n',
      beforeNodeDefinition: '// before node definition\n',
      insideNodeDefinition: '\n  // inside node definition\n',
      meta: '',
    };
    assert.deepEqual(parseImplementation(fixture), expected);
  });
  it('also extracts meta', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-with-meta.cpp'),
      'utf-8'
    );

    const expected = {
      afterNodeDefinition: '\n// after node definition\n',
      beforeNodeDefinition: '// before\n',
      insideNodeDefinition:
        '\n  // before meta\n  \n  // inside node definition\n',
      meta: '\n    // inside meta\n  ',
    };
    assert.deepEqual(parseImplementation(fixture), expected);
  });
});
