import * as R from 'ramda';
import * as XP from 'xod-project';
import { foldEither, mergeAllWithConcat, failOnNothing } from 'xod-func-tools';

// =============================================================================
//
// Utility functions. Skip it to the next header.
//
// =============================================================================

const getMarkerNodesErrorMap = (predicate, validator, errorType) => patch => {
  const markerNodeIds = R.compose(
    R.map(XP.getNodeId),
    R.filter(predicate),
    XP.listNodes
  )(patch);

  if (R.isEmpty(markerNodeIds)) return {};

  return foldEither(
    err =>
      R.compose(
        mergeAllWithConcat,
        R.map(R.objOf(R.__, { [errorType]: [err] }))
      )(markerNodeIds),
    R.always({ [errorType]: [] }),
    validator(patch)
  );
};

// =============================================================================
//
// Validators for Nodes
// :: Patch -> Project -> Map NodeId (Map ErrorType [Error])
//
// =============================================================================

// :: Patch -> Map NodeId (Map ErrorType [Error])
export const getVariadicMarkersErrorMap = getMarkerNodesErrorMap(
  R.pipe(XP.getNodeType, XP.isVariadicPath),
  XP.validatePatchForVariadics,
  'validatePatchForVariadics'
);

// :: Patch -> Map NodeId (Map ErrorType [Error])
export const getAbstractMarkersErrorMap = getMarkerNodesErrorMap(
  R.pipe(XP.getNodeType, R.equals(XP.ABSTRACT_MARKER_PATH)),
  XP.validateAbstractPatch,
  'validateAbstractPatch'
);

// :: Patch -> Map NodeId (Map ErrorType [Error])
export const getConstructorMarkersErrorMap = getMarkerNodesErrorMap(
  R.pipe(XP.getNodeType, R.equals(XP.OUTPUT_SELF_PATH)),
  XP.validateConstructorPatch,
  'validateConstructorPatch'
);

// :: Patch -> Map NodeId (Map ErrorType [Error])
export const getBusesErrorMap = (patch, _project) =>
  R.compose(
    R.map(R.objOf('validateBuses')),
    foldEither(
      err =>
        R.compose(
          R.map(R.of),
          R.fromPairs,
          R.map(R.pair(R.__, err)),
          R.path(['payload', 'nodeIds'])
        )(err),
      R.always({})
    ),
    XP.validateBuses
  )(patch);

// :: Patch -> Map NodeId (Map ErrorType [Error])
export const getTerminalsErrorMap = (patch, _project) =>
  R.compose(
    R.map(R.objOf('validatePinLabels')),
    foldEither(
      err =>
        R.compose(
          R.map(R.of),
          R.fromPairs,
          R.map(R.pair(R.__, err)),
          R.path(['payload', 'pinKeys']) // those are affected terminal node ids
        )(err),
      R.always([])
    ),
    XP.validatePinLabels
  )(patch);

// TODO: Use validator from xod-project after refactoring
// :: Patch -> Project -> Map NodeId (Map ErrorType [Error])
export const getDeadRefErrorMap = (patch, project) =>
  R.compose(
    R.map(
      R.compose(
        R.objOf('checkPatchExists'),
        foldEither(R.of, R.always([])),
        nodeType => {
          const patchPath = XP.getPatchPath(patch);
          return failOnNothing('DEAD_REFERENCE__PATCH_FOR_NODE_NOT_FOUND', {
            nodeType,
            patchPath,
            trace: [patchPath],
          })(XP.getPatchByPath(nodeType, project));
        },
        XP.getNodeType
      )
    ),
    R.indexBy(XP.getNodeId),
    XP.listNodes
  )(patch);

// =============================================================================
//
// Validators for Pins
// :: Patch -> Project -> Node -> Map PinKey PinErrors
//
// =============================================================================

export const validateBoundValues = R.curry((patch, project, node) =>
  R.compose(
    R.map(
      R.compose(
        R.objOf('errors'),
        R.objOf('getInvalidBoundNodePins'),
        foldEither(R.of, R.always([]))
      )
    ),
    XP.getInvalidBoundNodePins
  )(project, patch, node)
);

// =============================================================================
//
// Validators for Links
// :: Link -> Patch -> Project -> Map PatchPath DeducedPinTypes -> Map LinkId (Map ErrorType [Error])
//
// =============================================================================

export const validateLinkPins = R.curry(
  (link, patch, project, allDeducedPinTypes) =>
    R.compose(
      R.objOf(XP.getLinkId(link)),
      R.objOf('validateLinkPins'),
      foldEither(R.of, R.always([])),
      XP.validateLinkPins(link, patch, project),
      R.propOr({}, XP.getPatchPath(patch))
    )(allDeducedPinTypes)
);

// =============================================================================
//
// Default set of validate functions
//
// =============================================================================

/**
 * A default set of validate functions for each entity.
 * All these validations will be runned if there is no short-circuit
 * for the dispatched action.
 */
export const defaultValidateFunctions = {
  nodes: [
    getDeadRefErrorMap,
    getTerminalsErrorMap,
    getVariadicMarkersErrorMap,
    getAbstractMarkersErrorMap,
    getConstructorMarkersErrorMap,
    getBusesErrorMap,
  ],
  pins: [validateBoundValues],
  links: [validateLinkPins],
};
