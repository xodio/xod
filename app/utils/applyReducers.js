import R from 'ramda';

export default (reducers, state = {}, action) => {
  let hasChanged = false;
  const nextState = R.pipe(
    R.keys,
    R.reduce((nState, key) => {
      const prevStateForKey = nState[key];
      const nextStateForKey = reducers[key](nState[key], action, nState);
      hasChanged = hasChanged || nextStateForKey !== prevStateForKey;

      return R.assoc(key, nextStateForKey, nState);
    }, state)
  )(reducers);

  return hasChanged ? nextState : state;
};
