import R from 'ramda';
import undoable from 'redux-undo';
import { patchReducer } from './patchReducer';
import applyReducers from '../utils/applyReducers';
import { getPatchUndoType, getPatchRedoType, getPatchClearHistoryType } from '../actionTypes';

export const patches = (patchIds) => {
  const undoFilter = (action) => !(R.pathEq(['meta', 'skipHistory'], true, action));

  const reducers = R.pipe(
    R.values,
    R.reduce((p, id) => {
      const undoConfig = {
        filter: undoFilter,
        undoType: getPatchUndoType(id),
        redoType: getPatchRedoType(id),
        clearHistoryType: getPatchClearHistoryType(id),
      };
      return R.assoc(id, undoable(patchReducer, undoConfig), p);
    }, {})
  )(patchIds);

  return (state = {}, action, projectState) => applyReducers(reducers, state, action, projectState);
};
