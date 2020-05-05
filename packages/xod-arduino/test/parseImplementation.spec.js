import fs from 'fs';
import path from 'path';
import { assert } from 'chai';

import parseImplementation from '../src/parseImplementation';

describe('parseImplementation', () => {
  it('separates code based on GENERATED_CODE token', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-basic.cpp'),
      'utf-8'
    );

    const expected = {
      globals: '',
      beforeNodeImplementation: '// stuff before generated code statement\n',
      insideNodeImplementation: '\n// stuff after generated code statement\n',
    };
    assert.deepEqual(parseImplementation(fixture), expected);
  });
  it('extracts code from global blocks', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-with-global.cpp'),
      'utf-8'
    );

    const expected = {
      globals: '#include <Something.h>\n',
      beforeNodeImplementation:
        '// some stuff before global block\n\n// some more stuff\n',
      insideNodeImplementation:
        '\nvoid evaluate(Context ctx) {\n  // blah blah\n}\n',
    };
    assert.deepEqual(parseImplementation(fixture), expected);
  });
  it('handles multiple and empty global blocks', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-with-multiple-globals.cpp'),
      'utf-8'
    );

    const expected = {
      globals: '#include <Something.h>\n\n\n#include <AnotherThing.h>\n',
      beforeNodeImplementation:
        '// some stuff before global block\n\n\n\n// some more stuff\n\nstruct State {};\n',
      insideNodeImplementation:
        '\nvoid evaluate(Context ctx) {\n  // blah blah\n}\n',
    };
    assert.deepEqual(parseImplementation(fixture), expected);
  });
});
