import * as R from 'ramda';
import { maybePath, foldMaybe } from 'xod-func-tools';

import {
  getErrors as getErrorList,
  getAllErrorsForNode,
  getAllErrorsForLink,
  getAllErrorsForPatch,
} from './errorCollectors';

export const getHintingState = R.prop('hinting');

export const getDeducedTypes = R.compose(
  R.prop('deducedTypes'),
  getHintingState
);

export const getPatchSearchData = R.compose(
  R.prop('patchSearchData'),
  getHintingState
);

export const getErrors = R.compose(R.prop('errors'), getHintingState);

// :: PatchPath -> NodeId -> PatchPath -> Map PatchPath PatchErrors -> [Error]
export const getNodeErrors = R.curry((patchPath, nodeId, nodeType, errors) =>
  R.compose(
    R.uniq,
    R.converge(R.concat, [
      // Get errors for the specified Node
      // :: [Error]
      getAllErrorsForNode(patchPath, nodeId),
      // Get all errors for the Patch of specified Node
      // :: [Error]
      getAllErrorsForPatch(nodeType),
    ])
  )(errors)
);

// :: PatchPath -> LinkId -> Map PatchPath PatchErrors -> [Error]
export const getLinkErrors = R.curry(R.compose(R.uniq, getAllErrorsForLink));

// :: PatchPath -> Map PatchPath PatchErrors -> [Error]
export const getPatchErrors = R.compose(R.uniq, getAllErrorsForPatch);

// :: PatchPath -> NodeId -> PinKey -> Map PatchPath PatchErrors -> [Error]
export const getPinErrors = R.curry((patchPath, nodeId, pinKey, errors) =>
  R.compose(
    R.uniq,
    foldMaybe([], getErrorList),
    maybePath([patchPath, 'nodes', nodeId, 'pins', pinKey])
  )(errors)
);
