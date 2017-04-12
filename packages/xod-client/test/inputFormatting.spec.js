import { assert } from 'chai';
import { PROPERTY_TYPE } from '../src/editor/constants';
import { PROPERTY_TYPE_MASK } from '../src/utils/inputFormatting';

describe('number mask', () => {
  const numberMask = PROPERTY_TYPE_MASK[PROPERTY_TYPE.NUMBER];

  it('should not touch valid numbers', () => {
    assert.equal(
      numberMask('100'),
      '100'
    );

    assert.equal(
      numberMask('123.45'),
      '123.45'
    );

    assert.equal(
      numberMask('0.123'),
      '0.123'
    );
  });

  it('should remove characters that are not numbers or dot(.)', () => {
    assert.equal(
      numberMask('blah0.123blah'),
      '0.123'
    );
  });

  it('should leave only the first dot', () => {
    assert.equal(
      numberMask('1.2.3.4.5'),
      '1.2345'
    );
  });

  it('should allow a dot at the end', () => {
    assert.equal(
      numberMask('123.'),
      '123.'
    );
  });

  it('should add a leading zero if input begins with a dot', () => {
    assert.equal(
      numberMask('.'),
      '0.'
    );
  });
});
