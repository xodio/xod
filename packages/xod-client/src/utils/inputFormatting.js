import R from 'ramda';

import { PIN_TYPE } from 'xod-project';

export const lowercaseKebabMask = R.replace(/[^a-z0-9-]/g, '');

export const PROPERTY_TYPE_PARSE = {
  [PIN_TYPE.BOOLEAN]: v => !!v,
  [PIN_TYPE.NUMBER]: (v) => {
    const float = parseFloat(v, 10);
    return isNaN(float) ? 0 : float;
  },
  [PIN_TYPE.STRING]: v => String(v),
  [PIN_TYPE.PULSE]: v => v,
  [PIN_TYPE.DEAD]: v => v,
};
