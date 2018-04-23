import R from 'ramda';
import { enquote, unquote } from 'xod-func-tools';

import { def } from './types';
import { PIN_TYPE, INPUT_PULSE_PIN_BINDING_OPTIONS } from './constants';

//
// Literals
//

/**
 * Ensure that DataValue is a Literal.
 * In case DataValue contains an legacy DataValue, converts it into Literal.
 */
export const ensureLiteral = def(
  'ensureLiteral :: DataType -> DataValue -> DataValue',
  (type, value) => {
    switch (type) {
      case PIN_TYPE.PULSE:
        return R.compose(
          R.when(
            R.equals(false),
            R.always(INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER)
          ),
          R.when(
            R.has(R.__, INPUT_PULSE_PIN_BINDING_OPTIONS),
            R.prop(R.__, INPUT_PULSE_PIN_BINDING_OPTIONS)
          )
        )(value);
      case PIN_TYPE.BOOLEAN:
        return R.when(R.is(Boolean), v => (v ? 'True' : 'False'))(value);
      case PIN_TYPE.NUMBER:
        return R.when(R.is(Number), R.toString)(value);
      case PIN_TYPE.STRING:
        return R.pipe(unquote, enquote)(value);
      default:
        throw new Error(
          `Can't ensure Literal for unknown type "${type}" (value: "${value}")`
        );
    }
  }
);

export default {};
