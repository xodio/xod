import { assert } from 'chai';

import { getLibraryNameFromUrl } from '../src/libraryManager';

describe('Library Manager', () => {
  describe('getLibraryNameFromUrl()', () => {
    const assertJustEq = (url, expected) => {
      const res = getLibraryNameFromUrl(url);
      assert.isTrue(res.isJust);
      res.map(val => assert.strictEqual(val, expected));
    };
    it('returns unchanged `Just String` for simple library name', () => {
      assertJustEq('https://github.com/arduino-libraries/8266', '8266');
      assertJustEq('https://github.com/arduino-libraries/GSM', 'GSM');
      assertJustEq('https://github.com/FastLED/FastLED', 'FastLED');
    });
    it('returns normalized `Just String` for library name with forbidden characters', () => {
      assertJustEq(
        'https://github.com/z3t0/Arduino-IRremote',
        'Arduino_IRremote'
      );
      assertJustEq(
        'https://github.com/test/very-$tЯangэ-libName25',
        'very_tang_libName25'
      );
    });
    it('returns `Nothing` for library that contains only forbidden characters', () => {
      assert.isTrue(
        getLibraryNameFromUrl('https://github.com/test/~~|+&%@@').isNothing
      );
    });
    it('returns `Nothing` for invalid Url', () => {
      assert.isTrue(
        getLibraryNameFromUrl('https://github.com/xodio').isNothing
      );
      assert.isTrue(getLibraryNameFromUrl('http://xod.io/').isNothing);
    });
  });
});
