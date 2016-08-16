import R from 'ramda';
import {
  NODE_ADD,
  NODE_DELETE,
} from '../actionTypes';
import * as NODE_CATEGORY from '../constants/nodeCategory';


export const nodeTypes = (state = {}, action) => {
  switch (action.type) {
    case NODE_ADD: {
      if (action.payload.nodeType.category !== NODE_CATEGORY.IO) { return state; }

      const patchId = action.meta.patchId;
      const int = R.curry(R.flip(parseInt)(10));
      const eqPatchId = R.propEq('patchId', patchId);
      const oldId = R.pipe(
        R.pickBy(eqPatchId),
        R.values,
        R.head,
        R.propOr(null, 'id')
      )(state);

      if (oldId) { return state; }

      const newId = R.pipe(
        R.keys,
        R.map(int),
        R.reduce(R.max, -Infinity),
        R.inc
      )(state);

      return R.assoc(newId, {
        id: newId,
        patchId,
        category: NODE_CATEGORY.PATCHES,
      }, state);
    }
    case NODE_DELETE: {
      if (!action.payload.nodeType.id) { return state; }
      return R.omit([action.payload.nodeType.id.toString()], state);
    }
    default:
      return state;
  }
};
