import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import * as XP from 'xod-project';
import { foldMaybe, foldEither, isAmong, maybePath } from 'xod-func-tools';

import { getProject } from '../project/selectors';
import * as PAT from '../project/actionTypes';

import { getDeducedTypes } from './selectors';
import { updateDeducedTypes, updateErrors } from './actions';

const getActingPatchPath = maybePath(['payload', 'patchPath']);

// =============================================================================
//
// Project / Patch validation
//
// =============================================================================

const callFnIfExist = R.curry((fnMap, defFn, action, project) =>
  R.compose(
    fn => fn(project, action),
    R.defaultTo(defFn),
    R.prop(R.__, fnMap),
    R.prop('type')
  )(action)
);

// A map of functions, that accepts new project and action
// to check shall we need to run any validations on this changes
// Indexed by ActionTypes
// Return false to skip validation
// Map ActionType (Project -> Action -> Boolean)
const predicates = {
  [PAT.PROJECT_CREATE]: R.F,
  [PAT.BULK_MOVE_NODES_AND_COMMENTS]: (project, action) => {
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
  [PAT.NODE_UPDATE_PROPERTY]: (_, action) => action.payload.key !== 'label',
};

// Checks shall we need to run any validations in this change or not
// :: Action -> Project -> Boolean
const shallValidate = callFnIfExist(predicates, R.T);

// A map of short-circuit validations
// Indexed by ActionTypes
// Map ActionType (Project -> Action -> Either Error Project)
const shortValidators = {};

// :: Project -> Action -> Either Error Project
const basicValidator = (project, action) => {
  const maybePatchPath = getActingPatchPath(action);

  if (Maybe.isJust(maybePatchPath)) {
    return R.compose(
      R.ifElse(Maybe.isJust, foldMaybe(null, R.identity), () =>
        XP.validateProject(project)
      ),
      R.map(XP.validatePatchContents(R.__, project)),
      R.chain(XP.getPatchByPath(R.__, project))
    )(maybePatchPath);
  }

  return XP.validateProject(project);
};

// Validates Project
// If there is a short validator for occured action it will run this validation
// otherwise it will run a basic validation
// :: Action -> Project -> Either Error Project
const validateProject = callFnIfExist(shortValidators, basicValidator);

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
  if (action.type === PAT.PROJECT_CREATE) {
    return {}; // Just drop all deduced pin types on creating new project
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
  next(action);
  let newState = store.getState();
  const newProject = getProject(newState);

  if (oldProject === newProject) return newState;

  console.log(
    'Project changed',
    action,
    newProject,
    `validate? ${shallValidate(action, newProject)}`
  );

  if (shallDeduceTypes(action)) {
    const newDeducedTypes = deducePinTypesForProject(
      newProject,
      action,
      getDeducedTypes(newState)
    );
    next(updateDeducedTypes(newDeducedTypes));
    newState = store.getState();
  }

  return R.ifElse(
    shallValidate(action),
    R.compose(
      foldEither(err => {
        console.log('invalid', err);
        return oldState;
      }, R.always(newState)),
      validateProject(action)
    ),
    R.always(newState)
  )(newProject);
};
