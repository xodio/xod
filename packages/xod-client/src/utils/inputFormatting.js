import R from 'ramda';
import { PROPERTY_TYPE } from '../editor/constants';

export const lowercaseKebabMask = R.replace(/[^a-z0-9-]/g, '');

export const PROPERTY_TYPE_PARSE = {
  [PROPERTY_TYPE.BOOL]: v => !!v,
  [PROPERTY_TYPE.NUMBER]: (v) => {
    const float = parseFloat(v, 10);
    return isNaN(float) ? 0 : float;
  },
  [PROPERTY_TYPE.STRING]: v => String(v),
  [PROPERTY_TYPE.PULSE]: v => v,
};
