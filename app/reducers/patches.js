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

const initUndoable = (reducers, state) => {
  const id = state.meta.id;
  return undoable(combineReducers(reducers), {
    filter: undoFilter,
    undoType: getPatchUndoType(id),
    redoType: getPatchRedoType(id),
    clearHistoryType: getPatchClearHistoryType(id),
  });
};

export const patchesReducer = (state = {}, action) => {
  const reducers = {
    meta: patchMeta,
    nodeTypes,
    links,
    pins,
    nodes,
  };

  return R.pipe(
    R.keys,
    R.reduce((p, pId) => {
      let patch = state[pId];

      if (patch.hasOwnProperty('present')) {
        patch = patch.present;
      }

      const undoReducer = initUndoable(reducers, patch);
      return R.assoc(pId, undoReducer(state[pId], action), p);
    }, {})
  )(state);
};
