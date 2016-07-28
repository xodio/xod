import R from 'ramda';
import { combineReducers } from 'redux';
import undoable from 'redux-undo';

import { patchMeta } from './patchMeta';
import { pins } from './pins';
import { links } from './links';
import { nodes } from './nodes';
import { nodeTypes } from './nodetypes';

import { getPatchUndoType, getPatchRedoType, getPatchClearHistoryType } from '../actionTypes';

const undoFilter = (action) => !(R.pathEq(['meta', 'skipHistory'], true, action));

export const patchesReducer = (state = {}, action) => {
  const reducers = {
    meta: patchMeta,
    nodeTypes,
    links,
    pins,
    nodes,
  };

  const patches = R.values(state);

  return R.reduce((prev, patch) => {
    const id = patch.meta.id;
    let history;
    let present;

    if (typeof patch === 'object') {
      history = undoable(combineReducers(reducers), {
        filter: undoFilter,
        undoType: getPatchUndoType(id),
        redoType: getPatchRedoType(id),
        clearHistoryType: getPatchClearHistoryType(id),
      });
      present = patch;
    } else {
      history = patch;
      present = patch.present;
    }

    return R.assoc(id, history(present, action), prev);
  }, {}, patches);
};
