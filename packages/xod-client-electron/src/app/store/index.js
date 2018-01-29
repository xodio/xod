import * as R from 'ramda';
import { bindActionCreators } from 'redux';

import createStore from './store';
import * as Actions from './actions';
import * as Selectors from './selectors';

export default () => {
  const store = createStore({});
  return {
    getState: store.getState,
    // Here is some magic to call actions simply "store.dispatch.someAction()"
    // instead of calling it "store.dispatch(someAction())".
    //
    // It simplifies some interactions with Store, cause
    //   - we don't have a "context" like in React to keep store in it,
    //     so we have to pass Store inside some functions
    //   - we don't need to import or pass inside functions action creators,
    //     that should be passed into `dispatch` method later.
    //
    // So it's a dispatch function, that could be called with object,
    // but it also have a binded action creators.
    dispatch: R.reduce(
      (acc, [actionName, fn]) => {
        // eslint-disable-next-line no-param-reassign
        acc[actionName] = bindActionCreators(fn, acc);
        return acc;
      },
      store.dispatch,
      R.toPairs(Actions)
    ),
    subscribe: store.subscribe,
    replaceReducer: store.replaceReducer,
    // The similar thing as `dispatch`, but its just a Map with
    // functions, that could select some data from State.
    // Motivation to do this is the same as in the dispatch method.
    select: R.map(fn => () => fn(store.getState()), Selectors),
  };
};
