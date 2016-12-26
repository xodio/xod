import R from 'ramda';
import undoable from 'redux-undo';

import patchStaticReducer from './static';
import patchContentsReducer from './content';

import {
  newPatch,
  getStatic,
  getHistory,
  isPatchWithoutHistory,
  isActionNotForThisPatch,
} from './utils';
import {
  getPatchUndoType,
  getPatchRedoType,
  getPatchClearHistoryType,
} from '../../actionTypes';

// filter function for redux-undo (true if it should be added into history)
const keepHistory = R.complement(R.pathEq(['meta', 'skipHistory'], true));

const patchReducer = (id) => {
  const undoConfig = {
    filter: keepHistory,
    undoType: getPatchUndoType(id),
    redoType: getPatchRedoType(id),
    clearHistoryType: getPatchClearHistoryType(id),
  };

  const patchStatic = patchStaticReducer(id);
  const patchHistory = undoable(patchContentsReducer(), undoConfig);

  return (state = { id }, action) => {
    const tState = isPatchWithoutHistory(state) ? newPatch(state) : state;
    if (isActionNotForThisPatch(action, id)) { return tState; }

    const staticOld = getStatic(tState);
    const historyOld = getHistory(tState);

    const staticNew = patchStatic(staticOld, action);
    const historyNew = getHistory(patchHistory(historyOld, action));

    const isStaticUpdated = R.equals(staticOld, staticNew);
    const staticResult = isStaticUpdated ? staticOld : staticNew;

    const isHistoryUpdated = R.equals(historyOld.present, historyNew.present);
    const historyResult = isHistoryUpdated ? historyOld : historyNew;

    return R.merge({ static: staticResult }, historyResult);
  };
};

export default patchReducer;
export { newPatch } from './utils';
