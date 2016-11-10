import R from 'ramda';
import undoable from 'redux-undo';

import patchStaticReducer from './static';
import patchContentsReducer from './content';

import {
  newPatch,
  getStatic,
  getHistory,
  isPatchWithoutHistory,
  isActionForThisPatch,
} from './utils';
import {
  getPatchUndoType,
  getPatchRedoType,
  getPatchClearHistoryType,
} from '../../actionTypes';

// filter function for redux-undo (true if it should be added into history)
const keepHistory = (action) => !(R.pathEq(['meta', 'skipHistory'], true, action));

const patchReducer = (id) => {
  const undoConfig = {
    filter: keepHistory,
    undoType: getPatchUndoType(id),
    redoType: getPatchRedoType(id),
    clearHistoryType: getPatchClearHistoryType(id),
  };

  const patchStatic = patchStaticReducer(id);
  const patchHistory = undoable(patchContentsReducer(id), undoConfig);

  return (state = { id }, action) => {
    const tState = isPatchWithoutHistory(state) ? newPatch(state) : state;
    if (isActionForThisPatch(action, id)) { return tState; }

    const staticResult = patchStatic(getStatic(tState), action);
    const historyResult = patchHistory(getHistory(tState), action);

    return R.merge({ static: staticResult }, historyResult);
  };
};

export default patchReducer;
export { newPatch } from './utils';
