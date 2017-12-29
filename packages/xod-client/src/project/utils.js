import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';

import * as XP from 'xod-project';

import {
  getOptimalPanningOffset,
  calcutaleNodeSizeFromPins,
  calculatePinPosition,
} from './nodeLayout';

import { LINK_ERRORS } from '../editor/constants';

// :: NodeId -> PinKey -> RenderableNodes -> RenderablePin
export const getRenderablePin = R.uncurryN(3, (nodeId, pinKey) => R.path([nodeId, 'pins', pinKey]));

// :: [NodeId] -> Link -> Boolean
export const isLinkConnectedToNodeIds =
  R.uncurryN(2, nodeIds =>
    R.compose(
      R.complement(R.isEmpty),
      R.intersection(nodeIds),
      XP.getLinkNodeIds
    )
  );

//
// pins linking validation utils
//

// :: RenderablePin -> String | Null
export const getPinSelectionError = (pin) => {
  if (XP.isInputPin(pin) && pin.isConnected) {
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

  const inputPin = XP.isInputPin(pin1) ? pin1 : pin2;
  const outputPin = XP.isOutputPin(pin1) ? pin1 : pin2;

  if (!XP.canCastTypes(outputPin.type, inputPin.type)) {
    return LINK_ERRORS.INCOMPATIBLE_TYPES;
  }

  return null;
});

// :: RenderablePin -> RenderablePin -> Boolean
export const canPinsBeLinked = R.complement(getLinkingError);

export const getPinLinkabilityValidator = (linkingPin, nodes) => {
  if (!linkingPin) {
    return R.F;
  }

  const selectedPin = R.path([linkingPin.nodeId, 'pins', linkingPin.pinKey], nodes);

  return canPinsBeLinked(selectedPin);
};

// :: State -> PatchPath -> Boolean
export const isPatchPathTaken = (state, newPatchPath) => {
  const maybeExistingPatch = R.compose(
    XP.getPatchByPath(newPatchPath),
    R.prop('project')
  )(state);

  return Maybe.isJust(maybeExistingPatch);
};

// :: PatchPath -> Project -> Position
export const getInitialPatchOffset = R.compose(
  getOptimalPanningOffset,
  R.converge(
    R.concat,
    [
      R.compose(R.map(XP.getNodePosition), XP.listNodes),
      R.compose(R.map(XP.getCommentPosition), XP.listComments),
    ]
  ),
  XP.getPatchByPathUnsafe
);

// extract information from Patch that is required to render it with Node component
export const patchToNodeProps = (patch) => {
  const pins = XP.listPins(patch);
  const size = calcutaleNodeSizeFromPins(pins);
  const type = XP.getPatchPath(patch);

  return {
    id: type,
    type,
    label: '',
    position: { x: 0, y: 0 },
    size,
    pins: R.compose(
      R.indexBy(R.prop('keyName')),
      R.map(R.applySpec({
        key: XP.getPinKey,
        keyName: XP.getPinKey,
        type: XP.getPinType,
        direction: XP.getPinDirection,
        label: XP.getPinLabel,
        position: calculatePinPosition(size),
      })),
      XP.normalizePinLabels,
    )(pins),
  };
};

export const isPatchDeadTerminal = R.compose(
  R.ifElse(
    XP.isTerminalPatchPath,
    R.compose(
      R.equals(XP.PIN_TYPE.DEAD),
      XP.getTerminalDataType
    ),
    R.F
  ),
  XP.getPatchPath,
);
