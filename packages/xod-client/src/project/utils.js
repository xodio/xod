import R from 'ramda';

import { getLinkNodeIds, isInputPin, isOutputPin, PIN_TYPE } from 'xod-project';

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

  // types compatibility
  if (inputPin.type === PIN_TYPE.PULSE && outputPin.type !== PIN_TYPE.PULSE) {
    return LINK_ERRORS.INCOMPATIBLE_TYPES;
  } else if (
    inputPin.type === PIN_TYPE.STRING &&
    !R.contains(outputPin.type, [PIN_TYPE.BOOLEAN, PIN_TYPE.NUMBER, PIN_TYPE.STRING])
  ) {
    return LINK_ERRORS.INCOMPATIBLE_TYPES;
  } else if (
    R.contains(outputPin.type, [PIN_TYPE.BOOLEAN, PIN_TYPE.NUMBER]) &&
    !R.contains(outputPin.type, [PIN_TYPE.BOOLEAN, PIN_TYPE.NUMBER])
  ) {
    return LINK_ERRORS.INCOMPATIBLE_TYPES;
  }

  return null;
});

// :: RenderablePin -> RenderablePin -> Boolean
export const canPinsBeLinked = R.complement(getLinkingError);
