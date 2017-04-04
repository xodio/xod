import R from 'ramda';
import XP from 'xod-project';

import {
  NODE_ADD,
  NODE_MOVE,
  NODE_UPDATE_PROPERTY,
  NODE_DELETE,
  LINK_ADD,
  LINK_DELETE,
  PATCH_ADD,
  PATCH_RENAME,
  PATCH_DELETE,
} from './actionTypes';

import { PROPERTY_KIND } from './constants';

// TODO: rewrite the whole prop updating thing when xod-core is completely ditched
const selectNodePropertyUpdater = ({ kind, key, value }) => {
  if (kind === PROPERTY_KIND.PIN) {
    return XP.setPinCurriedValue(key, value);
  }

  if (kind === PROPERTY_KIND.PROP) {
    if (key === 'label') {
      return XP.setNodeLabel(value);
    }
  }

  return R.identity;
};

export default (state = {}, action) => {
  switch (action.type) {
    case NODE_ADD: {
      const { typeId, position, newNodeId, patchId } = action.payload;

      const newNode = R.compose(
        XP.assocInitialPinValues(R.view(XP.lensPatch(typeId), state)),
        R.assoc('id', newNodeId), // TODO: who should handle id generation?
        XP.createNode
      )(position, typeId);

      return R.over(
        XP.lensPatch(patchId), // TODO: can we have a situation where patch does not exist?
        XP.assocNode(newNode),
        state
      );
    }

    case NODE_MOVE: {
      const { id, position, patchId } = action.payload;

      const currentPatchLens = XP.lensPatch(patchId);

      const node = R.compose(
        XP.getNodeByIdUnsafe(id),
        R.view(currentPatchLens)
      )(state);

      return R.over(
        currentPatchLens,
        XP.assocNode(
          XP.setNodePosition(position, node)
        ),
        state
      );
    }

    case NODE_UPDATE_PROPERTY: {
      const { id, patchId } = action.payload;

      const currentPatchLens = XP.lensPatch(patchId);

      const node = R.compose(
        XP.getNodeByIdUnsafe(id),
        R.view(currentPatchLens)
      )(state);

      return R.over(
        currentPatchLens,
        XP.assocNode(
          selectNodePropertyUpdater(action.payload)(node)
        ),
        state
      );
    }

    case NODE_DELETE: {
      const { id, patchId } = action.payload;

      return R.over(
        XP.lensPatch(patchId),
        XP.dissocNode(id),
        state
      );
    }

    case LINK_ADD: {
      const { pins, patchId } = action.payload;

      const firstPinNodeType = R.compose(
        XP.getNodeType,
        XP.getNodeByIdUnsafe(pins[0].nodeId),
        R.view(XP.lensPatch(patchId))
      )(state);

      const inputPinIndex = R.compose(
        R.ifElse(
          XP.isInputPin,
          R.always(0),
          R.always(1)
        ),
        XP.getPinByKeyUnsafe(pins[0].pinKey),
        R.view(XP.lensPatch(firstPinNodeType))
      )(state);

      const input = pins[inputPinIndex];
      const output = pins[1 - inputPinIndex];

      const newLink = XP.createLink(input.pinKey, input.nodeId, output.pinKey, output.nodeId);

      return R.over(
        XP.lensPatch(patchId),
        XP.rightOrInitial(XP.assocLink(newLink)),
        state
      );
    }

    case LINK_DELETE: {
      const { id, patchId } = action.payload;

      return R.over(
        XP.lensPatch(patchId),
        XP.dissocLink(id),
        state
      );
    }

    case PATCH_ADD: {
      const { id, label } = action.payload;

      const patch = R.pipe(
        XP.createPatch,
        XP.setPatchLabel(label)
      )();

      return XP.rightOrInitial(
        XP.assocPatch(id, patch),
        state
      );
    }

    case PATCH_RENAME: {
      const { label, patchId } = action.payload;

      return R.over(
        XP.lensPatch(patchId),
        XP.setPatchLabel(label),
        state
      );
    }

    case PATCH_DELETE: {
      const patchPath = action.payload.id;

      return XP.dissocPatch(patchPath, state);
    }
    default:
      return state;
  }
};
