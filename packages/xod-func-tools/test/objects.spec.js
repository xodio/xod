import { assert } from 'chai';

import {
  omitRecursively,
  omitNilValues,
  omitEmptyValues,
  subtractObject,
  renameKeys,
  reverseLookup,
  invertMap,
} from '../src/objects';

describe('objects', () => {
  describe('omitRecursively()', () => {
    it('omits values in deeply nested objects', () => {
      const obj = {
        omitMe: 'hello',
        foo: 2,
        bar: {
          qux: 4,
          moo: ['a', 'b', 'c'],
          baz: {
            omitMe: 'ola',
            quux: 6,
          },
        },
      };

      const cleanObj = omitRecursively(['omitMe'], obj);
      assert.deepEqual(cleanObj, {
        foo: 2,
        bar: {
          qux: 4,
          moo: ['a', 'b', 'c'],
          baz: {
            quux: 6,
          },
        },
      });
    });

    it('omits values in objects nested in arrays', () => {
      const obj = [[{ omitMe: 'hello', foo: 2 }]];
      const cleanObj = omitRecursively(['omitMe'], obj);
      assert.deepEqual(cleanObj, [[{ foo: 2 }]]);
    });
  });

  describe('omitNilValues()', () => {
    it('omits nil values from object', () => {
      assert.hasAllKeys(
        omitNilValues({ a: 1, b: 2, c: undefined, d: null, e: 3 }),
        ['a', 'b', 'e']
      );
    });
  });
  describe('omitEmptyValues()', () => {
    it('omits empty values from object', () => {
      assert.hasAllKeys(omitEmptyValues({ a: 1, b: 2, c: '', d: '', e: 3 }), [
        'a',
        'b',
        'e',
      ]);
    });
  });

  describe('subtractObject()', () => {
    it('returns subtracted object (if fields are equal)', () => {
      assert.deepEqual(subtractObject({ a: 1, b: 2 }, { a: 1, b: 9, c: 3 }), {
        b: 9,
        c: 3,
      });
    });
  });

  describe('renameKeys()', () => {
    it('returns object with renamed keys', () => {
      assert.deepEqual(renameKeys({ a: 'b', b: 'c', c: 'd' }, { a: 1, b: 2 }), {
        b: 1,
        c: 2,
      });
    });
  });

  describe('reverseLookup()', () => {
    it('returns first finded key that contains specified value', () => {
      assert.equal(
        reverseLookup('find me', {
          a: 'a',
          b: 'b',
          c: 'find me',
          d: 'd',
          e: 'find me',
        }),
        'c'
      );
    });
  });

  describe('invertMap()', () => {
    it('returns object with switched keys and values', () => {
      assert.deepEqual(invertMap({ a: 'abc', b: 'bcd' }), {
        abc: 'a',
        bcd: 'b',
      });
    });
  });
});
