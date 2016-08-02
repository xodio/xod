import R from 'ramda';

const applyReducers = (reducers, state, action, context) => {
  let hasChanged = false;
  const nextState = R.pipe(
    R.keys,
    R.reduce((nState, key) => {
      const prevStateForKey = nState[key];
      const nextStateForKey = reducers[key](nState[key], action, context);
      hasChanged = hasChanged || nextStateForKey !== prevStateForKey;

      return R.assoc(key, nextStateForKey, nState);
    }, state)
  )(reducers);
  return hasChanged ? nextState : state;
};

export default applyReducers;
