import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import * as XP from 'xod-project';
import { maybeProp, foldMaybe, foldEither } from 'xod-func-tools';

import {
  getOptimalPanningOffset,
  calcutaleNodeSizeFromPins,
  calculatePinPosition,
  slotSizeToPixels,
} from './nodeLayout';

import { LINK_ERRORS } from '../editor/constants';

// :: NodeId -> PinKey -> RenderableNodes -> RenderablePin
export const getRenderablePin = R.uncurryN(3, (nodeId, pinKey) =>
  R.path([nodeId, 'pins', pinKey])
);

// :: [NodeId] -> Link -> Boolean
export const isLinkConnectedToNodeIds = R.uncurryN(2, nodeIds =>
  R.compose(R.complement(R.isEmpty), R.intersection(nodeIds), XP.getLinkNodeIds)
);

//
// pins linking validation utils
//

// :: RenderablePin -> RenderablePin -> String | Null
export const getLinkingError = R.curry((pin1, pin2) => {
  // same direction?
  if (pin1.direction === pin2.direction) return LINK_ERRORS.SAME_DIRECTION;

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

  const selectedPin = R.path(
    [linkingPin.nodeId, 'pins', linkingPin.pinKey],
    nodes
  );

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
  foldMaybe(
    { x: 0, y: 0 },
    R.compose(
      getOptimalPanningOffset,
      R.converge(R.concat, [
        R.compose(R.map(XP.getNodePosition), XP.listNodes),
        R.compose(R.map(XP.getCommentPosition), XP.listComments),
      ])
    )
  ),
  XP.getPatchByPath
);

// get normalized pin labels for patch
// :: Patch -> Map NodeId PinLabel
export const getNormalizedLabelsForPatch = R.compose(
  R.pluck('label'),
  R.indexBy(XP.getPinKey),
  XP.normalizeEmptyPinLabels,
  XP.listPins
);

// extract information from Patch that is required to render it with Node component
export const patchToNodeProps = R.curry(
  (shouldnormalizeEmptyPinLabels, patch) => {
    const pins = XP.listPins(patch);
    const size = calcutaleNodeSizeFromPins(pins);
    const pxSize = slotSizeToPixels(size);
    const type = XP.getPatchPath(patch);
    const isVariadic = XP.isVariadicPatch(patch);
    const arityStep = foldMaybe(0, R.identity, XP.getArityStepFromPatch(patch));

    return {
      id: type,
      type,
      label: '',
      position: { x: 0, y: 0 },
      pxPosition: { x: 0, y: 0 },
      size,
      pxSize,
      isVariadic,
      pins: R.compose(
        R.when(
          () => isVariadic,
          renderablePins =>
            R.compose(
              R.merge(renderablePins),
              R.indexBy(R.prop('keyName')),
              R.map(R.assoc('isLastVariadicGroup', true)),
              R.takeLast(arityStep),
              R.sortBy(XP.getPinOrder),
              R.filter(XP.isInputPin),
              R.values
            )(renderablePins)
        ),
        R.indexBy(R.prop('keyName')),
        R.map(
          R.applySpec({
            key: XP.getPinKey,
            keyName: XP.getPinKey,
            type: XP.getPinType,
            direction: XP.getPinDirection,
            label: XP.getPinLabel,
            position: calculatePinPosition(pxSize),
          })
        ),
        shouldnormalizeEmptyPinLabels ? XP.normalizeEmptyPinLabels : R.identity
      )(pins),
    };
  }
);

export const isPatchDeadTerminal = R.compose(
  R.ifElse(
    XP.isTerminalPatchPath,
    R.compose(R.equals(XP.PIN_TYPE.DEAD), XP.getTerminalDataType),
    R.F
  ),
  XP.getPatchPath
);

export const isNotImplementedInXodNode = R.compose(
  R.equals(XP.NOT_IMPLEMENTED_IN_XOD_PATH),
  XP.getNodeType
);

export const getRenderablePinType = pin =>
  R.compose(
    R.unless(
      R.either(XP.isBuiltInType, R.equals('conflicting')),
      R.always('custom')
    ),
    foldMaybe(
      XP.getPinType(pin),
      foldEither(R.always('conflicting'), R.identity)
    ),
    maybeProp('deducedType')
  )(pin);
