import R from 'ramda';

// :: String -> Boolean
export const isValidVersion = R.test(
  /^(?:0|[^0\D]\d{0,9})\.(?:0|[^0\D]\d{0,9})\.(?:0|[^0\D]\d{0,9})$/);

export default isValidVersion;
