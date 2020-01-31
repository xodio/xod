import { assert } from 'chai';

import {
  BINDABLE_CUSTOM_TYPES,
  BINDABLE_CUSTOM_TYPE_VALIDATORS,
} from '../src/custom-types';

describe('Color Literal', () => {
  const validateColor =
    BINDABLE_CUSTOM_TYPE_VALIDATORS[BINDABLE_CUSTOM_TYPES.COLOR];

  it('valid HEX colors: uppercase full notation', () => {
    assert.isTrue(validateColor('#000000'));
    assert.isTrue(validateColor('#999999'));
    assert.isTrue(validateColor('#FA9ECD'));
  });
  it('invalid HEX color notation', () => {
    assert.isFalse(validateColor('#FFF'));
    assert.isFalse(validateColor('#123'));
    assert.isFalse(validateColor('#fff000'));
    assert.isFalse(validateColor('#GGGGGG'));
  });
});
