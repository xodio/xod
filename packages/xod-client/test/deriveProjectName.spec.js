import { assert } from 'chai';
import deriveProjectName from '../src/utils/deriveProjectName';

describe('Derive project name from filename', () => {
  const test = (input, output) =>
    it(`${input} -> ${output}`, () =>
      assert.equal(deriveProjectName(input), output));

  test('foo.xodball', 'foo');
  test('FooBar.xodball', 'foobar');
  test('FooBar Baz.xodball', 'foobar-baz');
  test('FooBar Baz 2.xodball', 'foobar-baz-2');
  test('FooBar Baz (2).xodball', 'foobar-baz-2');
  test('FooBar Baz (2).whatever.infix.xodball', 'foobar-baz-2');
  test('FooBar Baz (2).whatever.infix', 'foobar-baz-2');
  test('Multifile project', 'multifile-project');
  test('strange_FILE_name---so-is_it_okay?', 'strange-file-name-so-is-it-okay');
});
