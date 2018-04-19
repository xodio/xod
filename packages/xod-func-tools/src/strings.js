import R from 'ramda';
import { def } from './types';

export const enquote = def('enquote :: String -> String', s => `"${s}"`);

export const unquote = def(
  'unquote :: String -> String',
  R.when(R.test(/^".*"$/), R.pipe(R.init, R.tail))
);
