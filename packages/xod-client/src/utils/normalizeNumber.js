import * as R from 'ramda';
import { isValidNumberDataValue } from 'xod-project';

export default R.compose(
  // If value is not valid number — fallback to '0'.
  R.unless(isValidNumberDataValue, R.always('0')),
  // Let user type `nan`, `+inf`, `-inf` values with wrong case
  // and type `+Inf` without plus symbol — correct it automatically
  R.cond([
    [R.equals('nan'), R.always('NaN')],
    [R.equals('inf'), R.always('Inf')],
    [R.equals('+inf'), R.always('+Inf')],
    [R.equals('-inf'), R.always('-Inf')],
    [R.T, R.identity],
  ]),
  R.toLower
);
