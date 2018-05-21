import * as R from 'ramda';
import { DEFAULT_VALUE_OF_TYPE, PIN_TYPE } from 'xod-project';

const LEADING_CHAR = {
  [PIN_TYPE.PORT]: 'D',
  [PIN_TYPE.PORT_ANALOG]: 'A',
};

const TEST_PORT = {
  [PIN_TYPE.PORT]: /^(A|D)\d+/i,
  [PIN_TYPE.PORT_ANALOG]: /^A\d+/i,
};

// :: PinType -> DataValue -> DataValue
const normalizeFn = R.curry((pinType, input) =>
  R.ifElse(
    R.test(TEST_PORT[pinType]),
    R.identity,
    R.pipe(
      x => parseInt(x, 10),
      R.ifElse(
        isNaN,
        R.always(DEFAULT_VALUE_OF_TYPE[pinType]),
        x => `${LEADING_CHAR[pinType]}${x}`
      )
    )
  )(input)
);

// :: DataValue -> DataValue
export const normalizePort = normalizeFn(PIN_TYPE.PORT);
// :: DataValue -> DataValue
export const normalizeAnalogPort = normalizeFn(PIN_TYPE.PORT_ANALOG);
