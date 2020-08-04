import fs from 'fs';
import path from 'path';
import { assert } from 'chai';

import parseLegacyImplementation from '../src/parseLegacyImplementation';

describe('parseLegacyImplementation', () => {
  it('separates code based on GENERATED_CODE token', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-legacy-basic.cpp'),
      'utf-8'
    );

    const expected = {
      globals: '',
      beforeNodeImplementation: '// stuff before generated code statement\n',
      insideNodeImplementation: '\n// stuff after generated code statement\n',
    };
    assert.deepEqual(parseLegacyImplementation(fixture), expected);
  });
  it('extracts code from global blocks', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-legacy-with-global.cpp'),
      'utf-8'
    );

    const expected = {
      globals: '#include <Something.h>\n',
      beforeNodeImplementation:
        '// some stuff before global block\n\n// some more stuff\n',
      insideNodeImplementation:
        '\nvoid evaluate(Context ctx) {\n  // blah blah\n}\n',
    };
    assert.deepEqual(parseLegacyImplementation(fixture), expected);
  });
  it('handles multiple and empty global blocks', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-legacy-with-multiple-globals.cpp'),
      'utf-8'
    );

    const expected = {
      globals: '#include <Something.h>\n\n\n#include <AnotherThing.h>\n',
      beforeNodeImplementation:
        '// some stuff before global block\n\n\n\n// some more stuff\n\nstruct State {};\n',
      insideNodeImplementation:
        '\nvoid evaluate(Context ctx) {\n  // blah blah\n}\n',
    };
    assert.deepEqual(parseLegacyImplementation(fixture), expected);
  });
});
