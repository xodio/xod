import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import * as XP from 'xod-project';
import {
  foldMaybe,
  foldEither,
  explodeMaybe,
  isAmong,
  maybePath,
  mergeAllWithConcat,
  notEmpty,
} from 'xod-func-tools';

import { getProject } from '../project/selectors';
import * as PAT from '../project/actionTypes';

import { getDeducedTypes, getErrors } from './selectors';
import { updateDeducedTypes, updateErrors } from './actions';

const getActingPatchPath = maybePath(['payload', 'patchPath']);

// =============================================================================
//
// Project / Patch validation
//
// =============================================================================

const callFnIfExist = R.curry(
  (fnMap, defFn, action, project, allDeducedPinTypes) =>
    R.compose(
      fn => fn(action, project, allDeducedPinTypes),
      R.defaultTo(defFn),
      R.prop(R.__, fnMap),
      R.prop('type')
    )(action)
);

// A map of functions, that accepts new project and action
// to check shall we need to run any validations on this changes
// Indexed by ActionTypes
// Return false to skip validation
// Map ActionType (Action -> Project -> Boolean)
const predicates = {
  [PAT.PROJECT_CREATE]: R.F,
  [PAT.BULK_MOVE_NODES_AND_COMMENTS]: (action, project) => {
    // Could change validity only when moving terminals or `output-self` marker
    const nodeIds = action.payload.nodeIds;
    if (nodeIds.length === 0) return false;

    const patchPath = action.payload.patchPath;

    return R.compose(
      foldMaybe(
        true,
        R.compose(
          R.any(R.either(XP.isTerminalPatchPath, XP.isTerminalSelf)),
          R.map(XP.getNodeType)
        )
      ),
      R.chain(
        R.pipe(
          patch => R.map(XP.getNodeById(R.__, patch), nodeIds),
          R.sequence(Maybe.of)
        )
      ),
      XP.getPatchByPath(patchPath)
    )(project);
  },
  [PAT.NODE_UPDATE_PROPERTY]: action => action.payload.key !== 'label',
};

// Checks shall we need to run any validations in this change or not
// :: Action -> Project -> Boolean
const shallValidate = callFnIfExist(predicates, R.T);

// A map of short-circuit validations
// Indexed by ActionTypes
// Map ActionType (Action -> Project -> Map PatchPath (Map NodeId [Error]))
const shortValidators = {};

// ========

const getMarkerNodesErrorMap = (predicate, validator) => patch => {
  const markerNodeIds = R.compose(
    R.map(XP.getNodeId),
    R.filter(predicate),
    XP.listNodes
  )(patch);

  if (R.isEmpty(markerNodeIds)) return {};

  return foldEither(
    err =>
      R.compose(R.map(R.of), R.fromPairs, R.map(R.pair(R.__, [err])))(
        markerNodeIds
      ),
    R.always({}),
    validator(patch)
  );
};

// :: Patch -> Map NodeId [Error]
const getVariadicMarkersErrorMap = getMarkerNodesErrorMap(
  R.pipe(XP.getNodeType, XP.isVariadicPath),
  XP.validatePatchForVariadics
);

// :: Patch -> Map NodeId [Error]
const getAbstractMarkersErrorMap = getMarkerNodesErrorMap(
  R.pipe(XP.getNodeType, R.equals(XP.ABSTRACT_MARKER_PATH)),
  XP.validateAbstractPatch
);

// :: Patch -> Map NodeId [Error]
const getConstructorMarkersErrorMap = getMarkerNodesErrorMap(
  R.pipe(XP.getNodeType, R.equals(XP.OUTPUT_SELF_PATH)),
  XP.validateConstructorPatch
);

// :: Patch -> Map NodeId [Error]
const getTerminalsErrorMap = R.compose(
  foldEither(
    err =>
      R.compose(
        R.map(R.of),
        R.fromPairs,
        R.map(R.pair(R.__, err)),
        R.path(['payload', 'pinKeys']) // those are affected terminal node ids
      )(err),
    R.always({})
  ),
  XP.validatePinLabels
);

// ========

// PinErrors :: { errors: [Error] } | {}
// LinkErrors :: { errors: [Error] } | {}
// NodeErrors :: { errors: [Error], pins: Map PinKey PinErrors } | {}
// PatchErrors :: { errors: [Error], nodes: Map NodeId NodeErrors } | {}

// :: Project -> Patch -> Node -> Map PinKey PinErrors
const getPinErrors = R.curry((project, patch, node) =>
  R.compose(
    R.map(
      R.compose(
        R.objOf('errors'),
        foldEither(R.pipe(R.identity, R.of), R.always({}))
      )
    ),
    XP.getInvalidBoundNodePins
  )(project, patch, node)
);

// :: Project -> Patch -> Map NodeId NodeErrors
const getNodeErrors = R.curry((project, patch) =>
  R.compose(
    R.reject(
      R.both(
        R.pipe(R.prop('errors'), R.isEmpty),
        R.pipe(R.prop('pins'), R.isEmpty)
      )
    ),
    // :: Map NodeId NodeErrors
    nodeErrorsMap =>
      R.compose(
        R.map(
          R.compose(
            R.mergeAll,
            R.append(R.__, [{ errors: [], pins: {} }, nodeErrorsMap]),
            R.objOf('pins')
          )
        ),
        R.reject(R.isEmpty),
        R.map(getPinErrors(project, patch)),
        R.indexBy(XP.getNodeId),
        XP.listNodes
      )(patch),
    // :: Map NodeId { errors: [Error] }
    R.map(R.objOf('errors')),
    // :: Map NodeId [Error]
    () =>
      mergeAllWithConcat([
        getTerminalsErrorMap(patch),
        getVariadicMarkersErrorMap(patch),
        getAbstractMarkersErrorMap(patch),
        getConstructorMarkersErrorMap(patch),
      ])
  )()
);

// :: Project -> Patch -> Map PatchPath DeducedPinTypes -> Map LinkId LinkErrors
const getLinkErrors = R.curry((project, patch, allDeducedPinTypes) =>
  R.compose(
    R.reject(R.isEmpty),
    R.map(
      R.compose(
        foldEither(R.of, R.always([])),
        XP.validateLinkPins(
          R.__,
          patch,
          project,
          R.propOr({}, XP.getPatchPath(patch), allDeducedPinTypes)
        )
      )
    ),
    R.indexBy(XP.getLinkId),
    XP.listLinks
  )(patch)
);

// :: Map a b -> [a]
const getNotNilKeys = R.pipe(R.filter(R.isNil), R.keys);

// :: Map PatchPath (Map NodeId [Error]) -> Map PatchPath (Map NodeId [Error])
const mergeErrors = (prevErrors, nextErrors) => {
  const patchPathsToOmit = getNotNilKeys(nextErrors);
  return R.compose(R.omit(patchPathsToOmit), R.merge)(prevErrors, nextErrors);
};

// :: Project -> Patch -> { nodes: NodeErrors }
const getNodeErrorsForPatch = R.compose(R.objOf('nodes'), getNodeErrors);
// :: Project -> Patch -> Map PatchPath DeducedPinTypes -> { nodes: NodeErrors }
const getLinkErrorsForPatch = R.compose(R.objOf('links'), getLinkErrors);

// :: Project -> Map PatchPath DeducedPinTypes -> [Patch] -> Map PatchPath (Map NodeId [Error])
const validatePatches = R.curry((project, allDeducedPinTypes, patches) =>
  R.compose(
    R.reject(
      R.allPass([
        R.pipe(R.prop('errors'), R.isEmpty),
        R.pipe(R.prop('nodes'), R.isEmpty),
        R.pipe(R.prop('links'), R.isEmpty),
      ])
    ),
    R.map(patch =>
      R.mergeAll([
        { errors: [], nodes: {}, links: {} },
        getLinkErrorsForPatch(project, patch, allDeducedPinTypes),
        getNodeErrorsForPatch(project, patch),
      ])
    ),
    R.indexBy(XP.getPatchPath)
  )(patches)
);

// :: Project -> Map PatchPath DeducedPinTypes -> Map PatchPath (Map NodeId [Error])
const validateLocalPatches = (project, allDeducedPinTypes) =>
  R.compose(validatePatches(project, allDeducedPinTypes), XP.listLocalPatches)(
    project
  );

// :: Project -> Map PatchPath DeducedPinTypes -> Map PatchPath (Map NodeId [Error])
const validateAllPatches = (project, allDeducedPinTypes) =>
  R.compose(validatePatches(project, allDeducedPinTypes), XP.listPatches)(
    project
  );

// :: Action -> Project -> Map PatchPath DeducedPinTypes -> Map PatchPath (Map NodeId [Error])
const generalValidator = (action, project, allDeducedPinTypes) => {
  const maybePatchPath = getActingPatchPath(action);
  if (Maybe.isJust(maybePatchPath)) {
    const patchPath = explodeMaybe('IMPOSSIBLE ERROR', maybePatchPath);
    return R.compose(
      foldMaybe(
        {},
        R.compose(
          R.when(
            notEmpty,
            () =>
              XP.isPathLocal(patchPath)
                ? validateLocalPatches(project, allDeducedPinTypes)
                : validateAllPatches(project, allDeducedPinTypes)
          ),
          // TODO: Do not check this patch again!
          validatePatches(project, allDeducedPinTypes),
          R.of
        )
      ),
      XP.getPatchByPath(R.__, project)
    )(patchPath);
  }

  return validateAllPatches(project);
};

// Validates Project
// If there is a short validator for occured action it will run this validation
// otherwise it will run a basic validation
// :: Action -> Project -> Map PatchPath (Map NodeId [Error])
const validateProject = callFnIfExist(shortValidators, generalValidator);

// =============================================================================
//
// Type deduction
//
// =============================================================================

// Run type deduction only for some actions
// :: Action -> Boolean
const shallDeduceTypes = R.compose(
  isAmong([
    PAT.PROJECT_CREATE,
    PAT.PROJECT_OPEN,
    PAT.PROJECT_IMPORT,
    PAT.BULK_DELETE_ENTITIES,
    PAT.LINK_ADD,
    PAT.NODE_UPDATE_PROPERTY,
  ]),
  R.prop('type')
);

// :: Project -> Action -> Maybe DeducedPinTypes
const deduceTypesForPatch = R.curry((project, action) =>
  R.compose(
    R.map(XP.deducePinTypes(R.__, project)),
    R.chain(XP.getPatchByPath(R.__, project)),
    getActingPatchPath
  )(action)
);

// :: Project -> Action -> Map PatchPath DeducedPinTypes -> Map PatchPath DeducedPinTypes
const deducePinTypesForProject = R.curry((project, action, deducedTypes) => {
  if (
    isAmong(
      [PAT.PROJECT_CREATE, PAT.PROJECT_OPEN, PAT.PROJECT_IMPORT],
      action.type
    )
  ) {
    // On creating / importing / opening project — deduce all pin types
    return R.compose(
      R.reject(R.isEmpty),
      R.map(XP.deducePinTypes(R.__, project)),
      R.indexBy(XP.getPatchPath),
      XP.listPatches
    )(project);
  }

  return R.compose(
    foldMaybe(deducedTypes, newDeducedTypesForPatch =>
      R.compose(
        R.assoc(R.__, newDeducedTypesForPatch, deducedTypes),
        foldMaybe('IMPOSIBLE', R.identity),
        getActingPatchPath
      )(action)
    ),
    deduceTypesForPatch
  )(project, action);
});

// =============================================================================
//
// Middleware
//
// =============================================================================

export default store => next => action => {
  const oldState = store.getState();
  const oldProject = getProject(oldState);
  const act = next(action);
  const newState = store.getState();
  const newProject = getProject(newState);

  if (oldProject === newProject) return newState;

  let deducedPinTypes = getDeducedTypes(newState);
  if (shallDeduceTypes(action)) {
    deducedPinTypes = deducePinTypesForProject(
      newProject,
      action,
      deducedPinTypes
    );
    next(updateDeducedTypes(deducedPinTypes));
  }

  if (shallValidate(action)) {
    const newErrors = validateProject(action, newProject, deducedPinTypes);
    const oldErrors = getErrors(newState);
    const errorsToUpdate = mergeErrors(oldErrors, newErrors);
    next(updateErrors(errorsToUpdate));
  }

  return act;
};
