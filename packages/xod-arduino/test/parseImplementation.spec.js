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

    const expected = [
      {
        type: 'global',
        contents:
          '// before node definition\nuint16_t nodeId = 42;\nauto nodespaceFoo = bar();\nauto metaTag = "meta";\n',
      },
      {
        type: 'global',
        contents: '\n',
      },
      {
        type: 'node',
        contents: '\n  // inside node definition\n',
        meta: '',
      },
      {
        type: 'global',
        contents: '\n// after node definition\n',
      },
    ];

    assert.deepEqual(parseImplementation(fixture), expected);
  });
  it('also extracts meta', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-with-meta.cpp'),
      'utf-8'
    );

    const expected = [
      {
        contents: '// before',
        type: 'global',
      },
      {
        contents: '\n',
        type: 'global',
      },
      {
        contents: '\n  // before meta\n  \n  // inside node definition\n',
        meta: '\n    // inside meta\n  ',
        type: 'node',
      },
      {
        contents: '\n// after node definition\n',
        type: 'global',
      },
    ];
    assert.deepEqual(parseImplementation(fixture), expected);
  });
  it('also extracts code from nodespace declarations', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, './fixtures/impl-with-nodespace.cpp'),
      'utf-8'
    );

    const expected = [
      {
        contents: '// before\n',
        type: 'global',
      },
      {
        contents: '\n  // inside nodespace\n',
        type: 'nodespace',
      },
      {
        contents: '\n// between nodespace and node\n',
        type: 'global',
      },
      {
        contents: '\n  // inside node definition\n',
        meta: '',
        type: 'node',
      },
      {
        contents: '\n// after node definition\n',
        type: 'global',
      },
    ];
    assert.deepEqual(parseImplementation(fixture), expected);
  });
});
