import R from 'ramda';
import {
  rightOrInitial,
  lensPatch,
  assocNode,
  assocLink,
  createNode,
  createLink,
  dissocPatch,
  setPatchLabel,
  createPatch,
  assocPatch,
} from 'xod-project';

import {
  NODE_ADD,
  LINK_ADD,
  PATCH_ADD,
  PATCH_RENAME,
  PATCH_DELETE,
} from './actionTypes';

export default (state = {}, action) => {
  switch (action.type) {
    case NODE_ADD: {
      const { typeId, position } = action.payload;
      const { patchId } = action.meta;

      // TODO: who should handle id generation?
      const newNode = createNode(position, typeId);

      return R.over(
        lensPatch(patchId),
        assocNode(newNode),
        state
      );
    }
    case LINK_ADD: {
      // TODO: why flipped pins? ([output, input])
      const { pins: [output, input] } = action.payload;
      const patchPath = action.meta.patchId;

      const newLink = createLink(input.pinKey, input.nodeId, output.pinKey, output.nodeId);

      return R.over(
        lensPatch(patchPath),
        rightOrInitial(assocLink(newLink)),
        state
      );
    }
    case PATCH_ADD: {
      const { newId, label } = action.payload;

      const patch = R.pipe(
        createPatch,
        setPatchLabel(label)
      )();

      return rightOrInitial(
        assocPatch(newId, patch),
        state
      );
    }
    case PATCH_RENAME: {
      const { label } = action.payload;
      const patchPath = action.meta.patchId;

      return R.over(
        lensPatch(patchPath),
        setPatchLabel(label),
        state
      );
    }
    case PATCH_DELETE: {
      const patchPath = action.payload.id;

      return dissocPatch(patchPath, state);
    }
    default:
      return state;
  }
};
