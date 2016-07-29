import R from 'ramda';
import undoable from 'redux-undo';
import { patchReducer } from './patchReducer';
// import applyReducers from '../utils/applyReducers';

export const patches = (patchIds) => {
  // const undoConfig = {
  //   filter: (action) => !(R.pathEq(['meta', 'skipHistory'], true, action)),
  // };

  return (state = {}, action) => R.pipe(
    R.values,
    R.reduce((p, id) => R.assoc(id, patchReducer(state[id], action), p), {})
  )(patchIds);
};
