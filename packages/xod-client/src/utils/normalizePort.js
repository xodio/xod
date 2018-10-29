import * as R from 'ramda';
import {
  DEFAULT_VALUE_OF_TYPE,
  PIN_TYPE,
  isValidPortLiteral,
} from 'xod-project';

const LEADING_CHAR = 'D';

// :: DataValue -> DataValue
export default input =>
  R.unless(
    isValidPortLiteral,
    R.pipe(
      x => parseInt(x, 10),
      R.ifElse(
        isNaN,
        R.always(DEFAULT_VALUE_OF_TYPE[PIN_TYPE.PORT]),
        x => `${LEADING_CHAR}${x}`
      )
    )
  )(input);
