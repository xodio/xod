import R from 'ramda';
import {
  NODE_ADD,
  // NODE_DELETE,
  // NODE_UPDATE_PROPERTY,
} from '../actionTypes';
import * as NODE_CATEGORY from '../constants/nodeCategory';


export const nodeTypes = (state = {}, action) => {
  switch (action.type) {
    case NODE_ADD: {
      if (!action.payload.patchNode) { return state; }

      const patchNode = action.payload.patchNode;

      const int = R.curry(R.flip(parseInt)(10));
      const eqPatchId = R.propEq('patchId', patchNode.patchId);

      const oldNodeType = R.pipe(
        R.pickBy(eqPatchId),
        R.values,
        R.head
      );

      const oldId = R.pipe(
        oldNodeType,
        R.propOr(null, 'id')
      );
      const newId = R.pipe(
        R.keys,
        R.map(int),
        R.reduce(R.max, -Infinity),
        R.inc
      );

      const nodeType = oldNodeType(state);
      const id = oldId(state) || newId(state);

      const pins = (nodeType) ? R.values(nodeType.pins) : [];
      const newPins = R.append(
        R.assoc('index', R.length(pins), patchNode.pins),
        pins
      );


      return R.assoc(id, {
        id,
        label: patchNode.label,
        patchId: patchNode.patchId,
        category: NODE_CATEGORY.PATCHES,
        pins: R.indexBy(R.prop('key'), newPins),
      }, state);
    }
    default:
      return state;
  }
};
