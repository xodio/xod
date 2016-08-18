import R from 'ramda';
import undoable from 'redux-undo';
import { patchReducer } from './patch';
import applyReducers from '../utils/applyReducers';
import {
  getPatchUndoType,
  getPatchRedoType,
  getPatchClearHistoryType,
  PATCH_ADD,
  PATCH_DELETE,
} from '../actionTypes';

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
      return R.assoc(id, undoable(patchReducer(id), undoConfig), p);
    }, {})
  )(patchIds);

  const newPatch = (action) => ({
    past: [],
    present: {
      id: action.payload.newId,
      name: action.payload.name || 'New patch',
      folderId: action.payload.folderId || null,
      nodes: {},
      links: {},
    },
    future: [],
  });

  return (state = {}, action) => {
    switch (action.type) {
      case PATCH_ADD:
        return R.assoc(
          action.payload.newId,
          newPatch(action),
          state
        );
      case PATCH_DELETE:
        return R.omit([action.payload.id.toString()], state);
      default:
        return applyReducers(reducers, state, action);
    }
  };
};
