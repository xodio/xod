import * as R from 'ramda';

// :: [a] -> Set a
export const setOf = a => new Set(a);
// :: a -> Set [a] -> Boolean
export const inSet = R.curry((v, s) => (s.has && s.has(v)) || false);
// :: StrMap a -> Set a
export const setOfKeys = R.pipe(R.keys, x => new Set(x));
// :: Set a -> Set a -> Set a
export const diffSet = R.curry((aSet, bSet) => {
  const a = Array.from(aSet).filter(x => !inSet(x, bSet));
  const b = Array.from(bSet).filter(x => !inSet(x, aSet));
  return new Set(a.concat(b));
});
