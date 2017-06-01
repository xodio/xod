import R from 'ramda';
import { PROPERTY_TYPE } from '../editor/constants';

export const lowercaseKebabMask = R.replace(/[^a-z0-9-]/g, '');

const removeAllDotsExceptFirst = str =>
  str.replace(/^([^.]*\.)(.*)$/, (a, b, c) => b + c.replace(/\./g, ''));

/**
 * transform value when input is in progress
 */
export const PROPERTY_TYPE_MASK = {
  [PROPERTY_TYPE.BOOL]: R.identity,
  [PROPERTY_TYPE.NUMBER]: R.compose(
    R.when(
      R.compose(R.equals('.'), R.head),
      R.concat('0')
    ),
    removeAllDotsExceptFirst,
    R.replace(/[^0-9.]/g, ''),
    R.toString
  ),
  [PROPERTY_TYPE.STRING]: R.identity,
  [PROPERTY_TYPE.PULSE]: R.identity,
};

export const PROPERTY_TYPE_PARSE = {
  [PROPERTY_TYPE.BOOL]: v => !!v,
  [PROPERTY_TYPE.NUMBER]: (v) => {
    const float = parseFloat(v, 10);
    return isNaN(float) ? 0 : float;
  },
  [PROPERTY_TYPE.STRING]: v => String(v),
  [PROPERTY_TYPE.PULSE]: v => !!v,
};
