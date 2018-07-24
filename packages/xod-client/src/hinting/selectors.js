import * as R from 'ramda';
import { maybePath, foldMaybe } from 'xod-func-tools';

import {
  getAllErrorsForNode,
  getAllErrorsForLink,
  getAllErrorsForPatch,
} from './utils';

export const getHintingState = R.prop('hinting');

export const getDeducedTypes = R.compose(
  R.prop('deducedTypes'),
  getHintingState
);

export const getErrors = R.compose(R.prop('errors'), getHintingState);

// :: PatchPath -> NodeId -> PatchPath -> Map PatchPath PatchErrors -> [Error]
export const getNodeErrors = R.curry((patchPath, nodeId, nodeType, errors) =>
  R.converge(R.concat, [
    // Get errors for the specified Node
    // :: [Error]
    getAllErrorsForNode(patchPath, nodeId),
    // Get all errors for the Patch of specified Node
    // :: [Error]
    getAllErrorsForPatch(nodeType),
  ])(errors)
);

// :: PatchPath -> LinkId -> Map PatchPath PatchErrors -> [Error]
export const getLinkErrors = getAllErrorsForLink;

// :: PatchPath -> Map PatchPath PatchErrors -> [Error]
export const getPatchErrors = getAllErrorsForPatch;

// :: PatchPath -> NodeId -> PinKey -> Map PatchPath PatchErrors -> [Error]
export const getPinErrors = R.curry((patchPath, nodeId, pinKey, errors) =>
  R.compose(
    foldMaybe([], R.identity),
    maybePath([patchPath, 'nodes', nodeId, 'pins', pinKey, 'errors'])
  )(errors)
);
