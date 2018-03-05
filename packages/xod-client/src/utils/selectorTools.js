import * as R from 'ramda';

// :: [a, b, ...] ->
//    [a, b, ...] ->
//    [(a -> a -> Boolean), (b -> b -> Boolean), ...] ->
//    Boolean
const depsChanged = (lastDeps, deps, comparators) => {
  if (!lastDeps) return true;

  const depPairs = R.zip(lastDeps, deps);
  const comparatorResults = R.zipWith(R.apply, comparators, depPairs);

  return R.any(R.equals(false), comparatorResults);
};

// :: [(s -> a), (s -> b), ...] ->
//    [(a -> a -> Boolean), (b -> b -> Boolean), ...] ->
//    (a -> b -> ... -> r) ->
//    s -> r
export const createMemoizedSelector = (
  dependencySelectors,
  dependencyComparators,
  selector
) => {
  let lastDeps = null;
  let lastResult = null;

  return state => {
    const deps = R.map(f => f(state), dependencySelectors);
    if (depsChanged(lastDeps, deps, dependencyComparators)) {
      lastResult = selector(...deps);
    }

    lastDeps = deps;

    return lastResult;
  };
};

export default {
  createMemoizedSelector,
};
