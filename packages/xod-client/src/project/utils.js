import R from 'ramda';
import { Maybe } from 'ramda-fantasy';

import {
  getLinkNodeIds,
  isInputPin,
  isOutputPin,
  getPatchPath,
  listLibraryPatches,
  omitPatches,
  getPatchByPath,
  canCastTypes,
} from 'xod-project';

import { getProject } from './selectors';

import { LINK_ERRORS } from '../editor/constants';

// :: NodeId -> PinKey -> RenderableNodes -> RenderablePin
export const getRenderablePin = R.uncurryN(3, (nodeId, pinKey) => R.path([nodeId, 'pins', pinKey]));

// :: NodeId -> Link -> Boolean
export const isLinkConnectedToNode =
  R.uncurryN(2, nodeId =>
    R.compose(
      R.contains(nodeId),
      getLinkNodeIds
    )
  );


//
// pins linking validation utils
//

// :: RenderablePin -> String | Null
export const getPinSelectionError = (pin) => {
  if (isInputPin(pin) && pin.isConnected) {
    return LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN;
  }

  return null;
};

// :: RenderablePin -> Boolean
export const isPinLinkable = R.complement(getPinSelectionError);

// :: RenderablePin -> RenderablePin -> String | Null
export const getLinkingError = R.curry((pin1, pin2) => {
  if (!isPinLinkable(pin1) || !isPinLinkable(pin2)) {
    return LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN;
  }

  // same direction?
  if (pin1.direction === pin2.direction) return LINK_ERRORS.SAME_DIRECTION;

  // very primitive case of a feedback loop
  // TODO: this needs to be much more complicated (and implemented in xod-project)
  if (pin1.nodeId === pin2.nodeId) {
    return LINK_ERRORS.SAME_NODE;
  }

  const inputPin = isInputPin(pin1) ? pin1 : pin2;
  const outputPin = isOutputPin(pin1) ? pin1 : pin2;

  if (!canCastTypes(outputPin.type, inputPin.type)) {
    return LINK_ERRORS.INCOMPATIBLE_TYPES;
  }

  return null;
});

// :: RenderablePin -> RenderablePin -> Boolean
export const canPinsBeLinked = R.complement(getLinkingError);

export const getJSONForExport = (project) => {
  const libPaths = R.compose(
    R.map(getPatchPath),
    listLibraryPatches
  )(project);

  return R.compose(
    p => JSON.stringify(p, null, 2),
    omitPatches(libPaths)
  )(project);
};

// :: State -> PatchPath -> Boolean
export const isPatchPathTaken = (state, newPatchPath) => {
  const maybeExistingPatch = R.compose(
    getPatchByPath(newPatchPath),
    getProject
  )(state);

  return Maybe.isJust(maybeExistingPatch);
};
