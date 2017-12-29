import * as R from 'ramda';

// :: String -> Boolean
export const isValidVersion = R.test(
  /^(?:0|[^0\D]\d{0,8})\.(?:0|[^0\D]\d{0,8})\.(?:0|[^0\D]\d{0,8})$/);

export default isValidVersion;
