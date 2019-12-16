import { assert } from 'chai';

import { BINDABLE_CUSTOM_TYPES_SPECS } from '../src/custom-types';

describe('Color Literal', () => {
  const { validateLiteral } = BINDABLE_CUSTOM_TYPES_SPECS.COLOR;
  it('valid HEX colors: uppercase full notation', () => {
    assert.isTrue(validateLiteral('#000000'));
    assert.isTrue(validateLiteral('#999999'));
    assert.isTrue(validateLiteral('#FA9ECD'));
  });
  it('invalid HEX color notation', () => {
    assert.isFalse(validateLiteral('#FFF'));
    assert.isFalse(validateLiteral('#123'));
    assert.isFalse(validateLiteral('#fff000'));
    assert.isFalse(validateLiteral('#GGGGGG'));
  });
});
