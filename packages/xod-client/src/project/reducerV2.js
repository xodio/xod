import R from 'ramda';
import {
  rightOrInitial,
  lensPatch,
  assocNode,
  assocLink,
  createNode,
  createLink,
} from 'xod-project';

import {
  NODE_ADD,
  LINK_ADD,
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
      const { patchId } = action.meta;

      const newLink = createLink(input.pinKey, input.nodeId, output.pinKey, output.nodeId);

      return R.over(
        lensPatch(patchId),
        rightOrInitial(assocLink(newLink)),
        state
      );
    }
    default:
      return state;
  }
};
