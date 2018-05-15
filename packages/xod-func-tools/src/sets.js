import * as R from 'ramda';

// :: [a] -> Set a
export const toSet = a => new Set(a);
// :: a -> Set [a] -> Boolean
export const inSet = R.curry((v, s) => (s.has && s.has(v)) || false);
