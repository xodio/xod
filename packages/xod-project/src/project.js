import * as R from 'ramda';
import { Either, Maybe } from 'ramda-fantasy';
import {
  foldMaybe,
  foldEither,
  catMaybies,
  explodeMaybe,
  explodeEither,
  notEmpty,
  isAmong,
  notNil,
  noop,
  maybeProp,
  memoizeOnlyLast,
  fail,
  failOnFalse,
  failOnNothing,
  prependTraceToError,
} from 'xod-func-tools';

import * as CONST from './constants';

import * as Link from './link';
import * as Node from './node';
import * as Patch from './patch';
import * as Pin from './pin';
import * as PatchPathUtils from './patchPathUtils';
import { def } from './types';
import * as Utils from './utils';
import { deducePinTypes } from './TypeDeduction_Js.bs';

import BUILT_IN_PATCHES from '../dist/built-in-patches.json';

/**
 * Root of a project’s state tree
 * @typedef {Object} Project
 */

/**
 * Archived project state
 * @typedef {Object} Xodball
 */

/**
 * @function createProject
 * @returns {Project} newly created project
 */
export const createProject = def('createProject :: () -> Project', () => ({
  '@@type': 'xod-project/Project',
  authors: [],
  description: '',
  license: '',
  version: '0.0.0',
  patches: {},
  name: '',
}));

export const getProjectName = def(
  'getProjectName :: Project -> ProjectName',
  R.prop('name')
);

export const setProjectName = def(
  'setProjectName :: ProjectName -> Project -> Project',
  R.assoc('name')
);

export const getProjectVersion = def(
  'getProjectVersion :: Project -> Version',
  R.prop('version')
);

export const setProjectVersion = def(
  'setProjectVersion :: Version -> Project -> Project',
  R.assoc('version')
);

/**
 * @function getProjectDescription
 * @param {Project} project
 * @returns {string}
 */
export const getProjectDescription = def(
  'getProjectDescription :: Project -> String',
  R.prop('description')
);

/**
 * @function setProjectDescription
 * @param {string} description
 * @param {Project} project
 * @returns {Project}
 */
export const setProjectDescription = def(
  'setProjectDescription :: String -> Project -> Project',
  R.assoc('description')
);

/**
 * @function getProjectAuthors
 * @param {Project} project
 * @returns {string[]}
 */
export const getProjectAuthors = def(
  'getProjectAuthors :: Project -> [String]',
  R.prop('authors')
);

/**
 * @function setProjectAuthors
 * @param {string[]} authors
 * @param {Project} project
 * @returns {Project}
 */
export const setProjectAuthors = def(
  'setProjectAuthors :: [String] -> Project -> Project',
  R.assoc('authors')
);

/**
 * @function getProjectLicense
 * @param {Project} project
 * @returns {string}
 */
export const getProjectLicense = def(
  'getProjectLicense :: Project -> String',
  R.prop('license')
);

/**
 * @function setProjectLicense
 * @param {string} value
 * @param {Project} project
 * @returns {Project}
 */
export const setProjectLicense = def(
  'setProjectLicense :: String -> Project -> Project',
  R.assoc('license')
);

/**
 * Adds proper fields to the a project data object that speed up type checking.
 */
export const injectProjectTypeHints = def(
  'injectTypeHints :: Project -> Project',
  R.compose(
    R.over(
      R.lensProp('patches'),
      R.map(
        R.compose(
          R.over(
            R.lensProp('nodes'),
            R.map(R.assoc('@@type', 'xod-project/Node'))
          ),
          R.over(
            R.lensProp('links'),
            R.map(R.assoc('@@type', 'xod-project/Link'))
          ),
          R.assoc('@@type', 'xod-project/Patch')
        )
      )
    ),
    R.assoc('@@type', 'xod-project/Project')
  )
);

// =============================================================================
//
// Patches
//
// =============================================================================

// :: String -> Boolean
export const isPathBuiltIn = R.has(R.__, BUILT_IN_PATCHES);

// :: Project -> Map PatchPath Patch
const getPatches = memoizeOnlyLast(project => {
  // those are not built-in or auto-generated patches
  const genuinePatches = R.prop('patches', project);

  const customTypeTerminals = R.compose(
    R.indexBy(Patch.getPatchPath),
    R.chain(constructorPatchPath =>
      R.compose(
        R.map(terminalPath =>
          Patch.setPatchPath(terminalPath, Patch.createPatch())
        ),
        R.map(PatchPathUtils.getTerminalPath(R.__, constructorPatchPath))
      )([CONST.PIN_DIRECTION.INPUT, CONST.PIN_DIRECTION.OUTPUT])
    ),
    R.map(Patch.getPatchPath),
    R.values,
    R.filter(Patch.isConstructorPatch)
  )(genuinePatches);

  return R.mergeAll([genuinePatches, BUILT_IN_PATCHES, customTypeTerminals]);
});

/**
 * @function listPatches
 * @param {Project} project - project bundle
 * @returns {Patch[]} list of all patches not sorted in any arbitrary order
 */
export const listPatches = def(
  'listPatches :: Project -> [Patch]',
  R.compose(R.values, getPatches)
);

/**
 * @function listGenuinePatches
 * @param {Project} project - project bundle
 * @returns {Patch[]} list of patches that were added to project, excluding built-ins
 */
export const listGenuinePatches = def(
  'listPatches :: Project -> [Patch]',
  R.compose(R.filter(Patch.isGenuinePatch), R.values, R.prop('patches'))
);

/**
 * Returns a list of paths to patches in the project.
 *
 * @function listPatchPaths
 * @param {Project} project - project bundle
 * @returns {String[]} list of all patch paths not sorted in any arbitrary order
 */
export const listPatchPaths = def(
  'listPatchPaths :: Project -> [PatchPath]',
  R.compose(R.keys, getPatches)
);

/**
 * Return a list of local patches (excluding external libraries)
 *
 * @function listLocalPatches
 * @param {Project} project
 * @returns {Patch[]}
 */
export const listLocalPatches = def(
  'listLocalPatches :: Project -> [Patch]',
  R.compose(
    R.filter(R.pipe(Patch.getPatchPath, PatchPathUtils.isPathLocal)),
    listPatches
  )
);

/**
 * Return a list of library patches (excluding local patches)
 *
 * @function listLibraryPatches
 * @param {Project} project
 * @returns {Patch[]}
 */
export const listLibraryPatches = def(
  'listLibraryPatches :: Project -> [Patch]',
  R.compose(
    R.filter(R.pipe(Patch.getPatchPath, PatchPathUtils.isPathLibrary)),
    listPatches
  )
);

/**
 * Returns a list of names of installed libraries in the project.
 * It means that Project has a Patches from these libraries.
 */
export const listInstalledLibraryNames = def(
  'listInstalledLibraryNames :: Project -> [LibName]',
  R.compose(
    R.uniq,
    R.reject(
      R.either(PatchPathUtils.isBuiltInLibName, PatchPathUtils.isLocalMarker)
    ),
    R.map(PatchPathUtils.getLibraryName),
    listPatchPaths
  )
);

/**
 * Returns a list of Library name that used in any Patch
 * inside specified Project. It will check all Patches in the Project.
 */
export const listLibraryNamesUsedInProject = def(
  'listLibraryNamesUsedInProject :: Project -> [LibName]',
  R.compose(
    R.uniq,
    R.unnest,
    R.map(Patch.listLibraryNamesUsedInPatch),
    listGenuinePatches
  )
);

/**
 * Returns a list of Library Names that used somewhere in the project
 * patches (local or library) as Nodes.
 */
export const listMissingLibraryNames = def(
  'listMissingLibraryNames :: Project -> [LibName]',
  R.converge(R.difference, [
    listLibraryNamesUsedInProject,
    listInstalledLibraryNames,
  ])
);

/**
 * @function getPatchByPath
 * @param {string} path - full path of the patch to find, e.g. `"@/bar"`
 * @param {Project} project - project bundle
 * @returns {Maybe<Patch>} a patch with given path
 */
export const getPatchByPath = def(
  'getPatchByPath :: PatchPath -> Project -> Maybe Patch',
  (path, project) => R.compose(maybeProp(path), getPatches)(project)
);

/**
 * @function getPatchByPathUnsafe
 * @param {string} path - full path of the patch to find, e.g. `"@/foo"`
 * @param {Project} project - project bundle
 * @returns {Patch} a patch with given path
 * @throws Error if patch was not found
 */
export const getPatchByPathUnsafe = def(
  'getPatchByPathUnsafe :: PatchPath -> Project -> Patch',
  (path, project) =>
    explodeMaybe(
      `Can't find the patch in the project with specified path: "${path}"`,
      getPatchByPath(path, project)
    )
);

export const hasPatch = def(
  'hasPatch :: PatchPath -> Project -> Boolean',
  R.compose(Maybe.isJust, getPatchByPath)
);

/**
 * Returns a map of Pins for the passed Node.
 *
 * If Node points to unexistent Patch, the Pins will be calculated
 * from Links, connected with it, with "UNKNOWN" type.
 * Such Nodes will be marked as dead.
 *
 * If Patch exists — it gets Pins from Patch and ensures, that all Links
 * conntected with specified Node really have a Pin. If not — it will
 * add pins with Unknown type (to render it properly).
 * Such Links will be marked as dead, but Nodes — not.
 *
 * Also, it checks for `arityLevel` property of the Node
 * and existence of variadic marker in the Patch. And adds
 * additional pins if `arityLevel` > 1.
 */
export const getPinsForNode = def(
  'getPinsForNode :: Node -> Patch -> Project -> Map PinKey Pin',
  (node, currentPatch, project) => {
    const type = Node.getNodeType(node);
    return R.compose(
      R.ifElse(
        Maybe.isJust,
        R.compose(
          explodeMaybe(`Expected valid pins for existent patch ${type}`),
          R.map(patch =>
            R.compose(
              Patch.upsertDeadPins(node, currentPatch),
              Patch.addVariadicPins(node, patch),
              Patch.getNondeadNodePins(node)
            )(patch)
          )
        ),
        () => Patch.getDeadNodePins(node, currentPatch)
      ),
      getPatchByPath
    )(type, project);
  }
);

/**
 * Returns `Maybe Patch`, that is defined as a type of the Node.
 * If specified Project contains specified Node it will return
 * `Just Patch` guaranteed. Otherwise it could be `Nothing`.
 */
export const getPatchByNode = def(
  'getPatchByNode :: Node -> Project -> Maybe Patch',
  (node, project) =>
    R.compose(getPatchByPath(R.__, project), Node.getNodeType)(node)
);
/**
 * Returns Maybe list of Pins, computed from the Patch,
 * that is defined as a type of the specified Node.
 */
export const getNodePins = def(
  'getNodePins :: Node -> Project -> Maybe [Pin]',
  (node, project) =>
    R.compose(R.map(Patch.listPins), getPatchByNode(R.__, project))(node)
);

const checkPinsCompatibility = def(
  'checkPinsCompatibility :: Patch -> Link -> DeducedPinTypes -> [Pin] -> Either Error Patch',
  (patch, link, deducedPinTypes, [inputPin, outputPin]) => {
    const patchPath = Patch.getPatchPath(patch);

    const pinTypes = [
      {
        original: Pin.getPinType(inputPin),
        deduced: R.path(
          [Link.getLinkInputNodeId(link), Link.getLinkInputPinKey(link)],
          deducedPinTypes
        ),
      },
      {
        original: Pin.getPinType(outputPin),
        deduced: R.path(
          [Link.getLinkOutputNodeId(link), Link.getLinkOutputPinKey(link)],
          deducedPinTypes
        ),
      },
    ];

    return R.compose(
      R.map(R.always(patch)),
      R.chain(
        R.compose(
          ([inputPinType, outputPinType]) =>
            failOnFalse(
              'INCOMPATIBLE_PINS__CANT_CAST_TYPES_DIRECTLY',
              {
                fromType: outputPinType,
                toType: inputPinType,
                patchPath,
                trace: [patchPath],
              },
              Utils.canCastTypes
            )(outputPinType, inputPinType),
          R.map(
            ({ original, deduced }) =>
              deduced ? explodeEither(deduced) : original
          )
        )
      ),
      R.ifElse(
        R.none(R.propSatisfies(R.both(notNil, Either.isLeft), 'deduced')),
        Either.of,
        R.compose(
          foldEither(
            conflictingTypes =>
              fail('INCOMPATIBLE_PINS__LINK_CAUSES_TYPE_CONFLICT', {
                types: conflictingTypes,
                trace: [patchPath],
              }),
            noop
          ),
          R.find(R.both(notNil, Either.isLeft)),
          R.map(R.prop('deduced'))
        )
      )
    )(pinTypes);
  }
);

/**
 * Checks one of the link ends (defined by getters).
 */
const checkLinkPin = def(
  'checkLinkPin :: (Link -> NodeId) -> (Link -> PinKey) -> Link -> Patch -> Project -> Either Error Pin',
  (nodeIdGetter, pinKeyGetter, link, patch, project) => {
    const nodeId = nodeIdGetter(link);
    const pinKey = pinKeyGetter(link);
    const patchPath = Patch.getPatchPath(patch);

    // :: Maybe Node
    const maybeNode = Patch.getNodeById(nodeId, patch);
    // :: Maybe NodeType
    const maybeNodeType = R.map(Node.getNodeType, maybeNode);
    // :: Maybe Patch
    const maybePatch = R.chain(getPatchByPath(R.__, project), maybeNodeType);

    // :: Maybe Patch -> Maybe Node -> Either Error (Map NodeId Pin)
    const checkPinExists = R.curry((mPatch, mNode) =>
      R.compose(
        failOnNothing('DEAD_REFERENCE__PINS_NOT_FOUND', {
          nodeId,
          pinKey,
          patchPath,
          trace: [patchPath],
        }),
        R.chain(([justPatch, justNode]) =>
          R.ifElse(
            Patch.isVariadicPatch,
            R.compose(
              Maybe,
              R.prop(pinKey),
              R.reject(Pin.isDeadPin),
              getPinsForNode(justNode, R.__, project)
            ),
            Patch.getPinByKey(pinKey)
          )(justPatch)
        ),
        R.sequence(Maybe.of)
      )([mPatch, mNode])
    );

    // :: Maybe Patch -> PatchPath -> Either Error Patch
    const checkPatchExists = (mPatch, nodeType) =>
      failOnNothing('DEAD_REFERENCE__PATCH_FOR_NODE_NOT_FOUND', {
        nodeType,
        patchPath,
        trace: [patchPath],
      })(mPatch);

    // :: Maybe Node -> Either Error Node
    const checkNodeExists = mNode =>
      failOnNothing('DEAD_REFERENCE__NODE_NOT_FOUND', {
        nodeId,
        patchPath,
        trace: [patchPath],
      })(mNode);

    return R.compose(
      R.chain(() => checkPinExists(maybePatch, maybeNode)),
      R.chain(
        R.compose(
          nodeType => checkPatchExists(maybePatch, nodeType),
          Node.getNodeType
        )
      ),
      checkNodeExists
    )(maybeNode);
  }
);

/**
 * Checks project for existence of patches and pins that used in link.
 *
 * @function validateLinkPins
 * @param {Link} link
 * @param {Patch} patch
 * @param {Project} project
 * @returns {Either<Error|Patch>}
 */
export const validateLinkPins = def(
  'validateLinkPins :: Link -> Patch -> Project -> DeducedPinTypes -> Either Error Patch',
  (link, patch, project, deducedPinTypes) => {
    const checkInputPin = checkLinkPin(
      Link.getLinkInputNodeId,
      Link.getLinkInputPinKey
    );
    const checkOutputPin = checkLinkPin(
      Link.getLinkOutputNodeId,
      Link.getLinkOutputPinKey
    );

    return R.compose(
      R.map(R.always(patch)),
      R.chain(checkPinsCompatibility(patch, link, deducedPinTypes)),
      R.sequence(Either.of)
    )([
      checkInputPin(link, patch, project),
      checkOutputPin(link, patch, project),
    ]);
  }
);

// Returns a map of PinKey and `Either.Left`s with errors
// describing node's invalid bound pins
export const getInvalidBoundNodePins = def(
  'getInvalidBoundNodePins :: Project -> Patch -> Node -> Map PinKey (Either Error a)',
  (project, currentPatch, node) => {
    const nodeId = Node.getNodeId(node);

    const linkedPins = R.compose(
      R.map(
        R.ifElse(
          Link.isLinkInputNodeIdEquals(nodeId),
          Link.getLinkInputPinKey,
          Link.getLinkOutputPinKey
        )
      ),
      Patch.listLinksByNode(node)
    )(currentPatch);

    const patchPath = Patch.getPatchPath(currentPatch);

    const nodeName = R.either(
      Node.getNodeLabel,
      R.pipe(Node.getNodeType, PatchPathUtils.getBaseName)
    )(node);

    const nodePatch = R.compose(
      getPatchByPath(R.__, project),
      Node.getNodeType
    )(node);

    return R.compose(
      catMaybies,
      R.mapObjIndexed((literal, pinKey) =>
        R.compose(
          R.map(pin => {
            const pinName = R.either(Pin.getPinLabel, Pin.getPinType)(pin);

            return fail('INVALID_LITERAL_BOUND_TO_PIN', {
              pinName,
              literal,
              trace: [patchPath, nodeName],
            });
          }),
          R.chain(Patch.getVariadicPinByKey(node, pinKey))
        )(nodePatch)
      ),
      R.reject(Utils.isValidLiteral),
      R.omit(linkedPins),
      Node.getAllBoundValues
    )(node);
  }
);

// part of `validatePatchContents`
const checkForInvalidBoundValues = R.curry((project, checkedPatch) =>
  R.compose(
    R.map(R.always(checkedPatch)),
    R.sequence(Either.of),
    R.map(node => {
      const invalidBoundValueErrors = R.compose(
        R.values,
        getInvalidBoundNodePins
      )(project, checkedPatch, node);

      return R.isEmpty(invalidBoundValueErrors)
        ? Either.of(node)
        : R.head(invalidBoundValueErrors);
    }),
    Patch.listNodes
  )(checkedPatch)
);

// part of `validatePatchContents`
const checkPatchForDeadNodes = def(
  'checkPatchForDeadNodes :: Project -> Patch -> Either Error Patch',
  (project, patch) => {
    const patchPath = Patch.getPatchPath(patch);

    return R.compose(
      R.map(R.always(patch)),
      R.sequence(Either.of),
      R.chain(
        R.compose(
          type =>
            R.compose(
              failOnNothing('DEAD_REFERENCE__PATCH_FOR_NODE_NOT_FOUND', {
                nodeType: type,
                patchPath,
                trace: [patchPath],
              }),
              getPatchByPath(R.__, project)
            )(type),
          Node.getNodeType
        )
      ),
      Patch.listNodes
    )(patch);
  }
);

// part of `validatePatchContents`
const checkPatchForDeadLinksAndPins = def(
  'checkPatchForDeadLinksAndPins :: Project -> Patch -> Either Error Patch',
  (project, patch) => {
    const deducedPinTypes = deducePinTypes(patch, project);

    return R.compose(
      R.ifElse(
        R.isEmpty,
        R.always(Either.of(patch)),
        R.compose(
          R.map(R.always(patch)),
          R.sequence(Either.of),
          R.map(validateLinkPins(R.__, patch, project, deducedPinTypes))
        )
      ),
      Patch.listLinks
    )(patch);
  }
);

/**
 * Checks `patch` content to be valid:
 *
 * - all nodes have existent types (patches),
 * - valid pinKeys in the links
 * @function validatePatchContents
 * @param {Patch} patch
 * @param {Project} project
 * @returns {Either<Error|Patch>}
 */
export const validatePatchContents = def(
  'validatePatchContents :: Patch -> Project -> Either Error Patch',
  (patch, project) =>
    checkPatchForDeadNodes(project, patch)
      .chain(checkPatchForDeadLinksAndPins(project))
      .chain(Patch.validatePinLabels)
      .chain(checkForInvalidBoundValues(project))
      .chain(Patch.validateAbstractPatch)
      .chain(Patch.validateConstructorPatch)
      .chain(Patch.validatePatchForVariadics)
      .chain(Patch.validateBuses)
);

/**
 * Inserts or updates the `patch` within the `project`
 * with validation of patch contents.
 *
 * Matching is done by patch’es path.
 *
 * @function assocPatch
 * @param {string} path
 * @param {Patch} patch - patch to insert or update
 * @param {Project} project - project to operate on
 * @returns {Project} copy of the project with the updated patch
 */
export const assocPatch = def(
  'assocPatch :: PatchPath -> Patch -> Project -> Project',
  (path, patch, project) =>
    R.compose(
      R.assocPath(['patches', path], R.__, project),
      Patch.setPatchPath(path)
    )(patch)
);

/**
 * @function lensPatch
 * @param {String} patchPath
 * @returns {Lens} a Ramda lens whose focus is a patch with the specified path.
 */
export const lensPatch = patchPath =>
  R.lens(getPatchByPathUnsafe(patchPath), (patch, project) =>
    R.ifElse(
      // To avoid mutating autogenerated patches
      // and/or mixing them with genuine ones
      Patch.isGenuinePatch,
      assocPatch(patchPath, R.__, project),
      R.always(project)
    )(patch)
  );

/**
 * Inserts or updates a list of Patches within the Project.
 * It takes a PatchPath from the Patches in the list.
 * Without validation of each patch.
 */
export const upsertPatches = def(
  'upsertPatches :: [Patch] -> Project -> Project',
  (patches, project) =>
    R.compose(
      R.reduce((proj, fn) => fn(proj), project),
      R.map(R.converge(assocPatch, [Patch.getPatchPath, R.identity]))
    )(patches)
);

/**
 * Inserts given patches into the `project`,
 * replacing old ones with same paths.
 *
 * @function mergePatchesList
 * @param {Patch[]} patches - patches to insert
 * @param {Project} project - project to operate on
 * @returns {Project} copy of the project with the patches inserted
 */
export const mergePatchesList = def(
  'mergePatchesList :: [Patch] -> Project -> Project',
  (patches, project) =>
    R.over(
      R.lensProp('patches'),
      R.flip(R.merge)(R.indexBy(Patch.getPatchPath, patches)),
      project
    )
);

/**
 * Removes the `patch` from the `project`.
 *
 * Does nothing if the `patch` not found in `project`.
 *
 * @function dissocPatch
 * @param {string} path - path to patch to remove
 * @param {Project} project - project to operate on
 * @returns {Project} copy of the project with the patch removed
 */
export const dissocPatch = def(
  'dissocPatch :: PatchPath -> Project -> Project',
  (path, project) => R.dissocPath(['patches', path], project)
);

/**
 * Removes `patch`es with given paths from the `project`.
 *
 * @function omitPatches
 * @param {string[]} paths - paths to patches to remove
 * @param {Project} project - project to operate on
 * @returns {Project} copy of the project with the patches removed
 */
export const omitPatches = def(
  'omitPatches :: [PatchPath] -> Project -> Project',
  (paths, project) => R.over(R.lensProp('patches'), R.omit(paths), project)
);

const doesPathExist = def(
  'doesPathExist :: PatchPath -> Project -> Boolean',
  R.compose(Maybe.isJust, getPatchByPath)
);

/**
 * Checks if a `patch` could be safely renamed given a new path.
 *
 * Check would fail in either case:
 * - `newPath` contains invalid characters
 * - `patch` is not in the `project`
 * - another patch with same path already exist
 *
 * @function validatePatchRebase
 * @param {string} newPath - new path for the patch
 * @param {string} oldPath - path to patch to rename
 * @param {Project} project - project to operate on
 * @returns {Either<Error|Project>} validation result
 */
export const validatePatchRebase = def(
  'validatePatchRebase :: PatchPath -> PatchPath -> Project -> Either Error Project',
  (newPath, oldPath, project) =>
    R.compose(
      R.map(R.always(project)),
      R.chain(
        failOnFalse(
          'CANT_REBASE_PATCH__OCCUPIED_PATH',
          { oldPath, newPath },
          R.complement(doesPathExist(R.__, project))
        )
      ),
      R.chain(
        oldPatch =>
          Patch.isGenuinePatch(oldPatch)
            ? Either.of(newPath)
            : fail('CANT_REBASE_PATCH__BUILT_IN_PATCH', { oldPath })
      ),
      failOnNothing('CANT_REBASE_PATCH__PATCH_NOT_FOUND_BY_PATH', {
        oldPath,
        newPath,
      }),
      getPatchByPath
    )(oldPath, project)
);

/**
 * Updates the `patch` in the `project` relocating it to a new path.
 *
 * Note that rebase will affect patch’es path that is used as its ID.
 *
 * All references to the patch from other patches will be set to
 * the new path.
 *
 * @function rebasePatch
 * @param {string} newPath - new path for the patch
 * @param {string} oldPath - old path for the patch
 * @param {Project} project - project to operate on
 * @returns {Either<Error|Project>} copy of the project with the patch renamed
 * @see {@link validatePatchRebase}
 */
export const rebasePatch = def(
  'rebasePatch :: PatchPath -> PatchPath -> Project -> Either Error Project',
  (newPath, oldPath, project) =>
    validatePatchRebase(newPath, oldPath, project).map(proj => {
      // we just checked that it exists in `validatePatchRebase`
      const oldPatch = getPatchByPathUnsafe(oldPath, proj);

      const pathReplacementsMap = R.compose(
        R.merge({ [oldPath]: newPath }),
        R.ifElse(
          Patch.isConstructorPatch,
          // if we are renaming a constructor patch,
          // update corresponding terminals as well,
          // because their names depend on it
          () =>
            R.compose(
              R.fromPairs,
              R.map(direction => [
                PatchPathUtils.getTerminalPath(direction, oldPath),
                PatchPathUtils.getTerminalPath(direction, newPath),
              ])
            )([CONST.PIN_DIRECTION.INPUT, CONST.PIN_DIRECTION.OUTPUT]),
          R.always({})
        )
      )(oldPatch);

      // TODO: Think about refactoring that piece of code :-D
      // Patch -> Patch
      const updateReferences = R.evolve({
        nodes: R.map(
          R.over(
            R.lens(Node.getNodeType, Node.setNodeType),
            R.when(
              R.has(R.__, pathReplacementsMap),
              R.prop(R.__, pathReplacementsMap)
            )
          )
        ),
      });

      return R.compose(
        R.evolve({
          patches: R.map(updateReferences),
        }),
        dissocPatch(oldPath),
        assocPatch(newPath, oldPatch)
      )(proj);
    })
);

/**
 * Updates patch inside Project and returns Either Error Project.
 * It's a safe version of `R.over(lensPatch('some-patch'), someFn, project);`
 */
export const updatePatch = def(
  'updatePatch :: PatchPath -> (Patch -> Patch) -> Project -> Either Error Project',
  (patchPath, updateFunction, project) =>
    R.compose(
      R.map(R.compose(assocPatch(patchPath, R.__, project), updateFunction)),
      failOnNothing('CANT_UPDATE_PATCH__PATCH_NOT_FOUND_BY_PATH', {
        patchPath,
      }),
      getPatchByPath
    )(patchPath, project)
);

// =============================================================================
//
// Getters with traversing through project
//
// =============================================================================
/**
 * Returns Maybe Pin, extracted from the Patch,
 * that is defined as a type of the Node.
 */
export const getNodePin = def(
  'getNodePin :: PinKey -> Node -> Project -> Maybe Pin',
  (pinKey, node, project) =>
    R.compose(
      R.chain(Patch.getPinByKey(pinKey)),
      getPatchByNode(R.__, project)
    )(node)
);

/**
 * Returns Patch, that are prototype of passed Node Id.
 * But to do it function needs a three arguments:
 * - NodeId
 * - Patch - Patch, that contains Node with specified NodeId
 * - Project - To find Patch, that are prototype of specified Node
 *
 * There is safe and unsafe versions:
 */
export const getPatchByNodeId = def(
  'getPatchByNodeId :: NodeId -> Patch -> Project -> Maybe Patch',
  (nodeId, patch, project) =>
    R.compose(
      R.chain(getPatchByPath(R.__, project)),
      R.map(Node.getNodeType),
      Patch.getNodeById(R.__, patch)
    )(nodeId)
);
export const getPatchByNodeIdUnsafe = def(
  'getPatchByNodeIdUnsafe :: NodeId -> Patch -> Project -> Patch',
  (nodeId, patch, project) =>
    R.compose(
      explodeMaybe(
        `Can't find prototype Patch of Node with Id "${nodeId}" from Patch "${Patch.getPatchPath(
          patch
        )}"`
      ),
      getPatchByNodeId
    )(nodeId, patch, project)
);

/**
 * Checks if there are any links that are connected
 * to a pin that a node with `terminalNodeId` represents.
 */
export const isTerminalNodeInUse = def(
  'isTerminalNodeInUse :: PinKey -> PatchPath -> Project -> Boolean',
  (terminalNodeId, patchPath, project) =>
    R.compose(
      R.any(patch =>
        R.compose(
          notEmpty,
          R.chain(node => Patch.listLinksByPin(terminalNodeId, node, patch)),
          R.filter(R.compose(R.equals(patchPath), Node.getNodeType)),
          Patch.listNodes
        )(patch)
      ),
      listLocalPatches // TODO: are only local patches enough?
    )(project)
);

/**
 * Resolves all NodeTypes of all Nodes in the Library Patches
 * using PatchPathUtils.resolvePatchPatch.
 * So all Nodes that refers to Patch in the same library
 * will have a resolved type and it will be handy to use after it.
 * E.G.
 * Library `xod/core` have a patch-node `xod/core/to-percent`,
 * which implementated on XOD, it reuses patches from the same
 * library: `@/multiply` and `@/concat`.
 * After calling this function User gets the same Project, but
 * patch-nodes like `xod/core/to-percent` now have Nodes with
 * updated Node Types: `@/multiply` will become `xod/core/multiply`
 * and `@/concat` will become `xod/core/concat`.
 */
export const resolveNodeTypesInProject = def(
  'resolveNodeTypesInProject :: Project -> Project',
  project =>
    R.compose(
      upsertPatches(R.__, project),
      R.map(Patch.resolveNodeTypesInPatch),
      R.filter(R.compose(R.any(Node.isLocalNode), Patch.listNodes)),
      listLibraryPatches
    )(project)
);

// Helper function for getPatchDependencies
// :: Project -> [PatchPath] -> Map PatchPath [PatchPath] -> Map PatchPath [PatchPath]
const getDependenciesMap = (project, patchPaths, depsMap) => {
  if (R.isEmpty(patchPaths)) {
    return depsMap;
  }

  const [currentPatchPath, ...restPatchPaths] = patchPaths;

  if (R.has(currentPatchPath, depsMap)) {
    return getDependenciesMap(project, restPatchPaths, depsMap);
  }

  const currentPatchDeps = R.compose(
    R.map(Node.getNodeType),
    Patch.listNodes,
    // TODO: make safer?
    getPatchByPathUnsafe(currentPatchPath)
  )(project);

  return getDependenciesMap(
    project,
    R.concat(restPatchPaths, currentPatchDeps),
    R.assoc(currentPatchPath, currentPatchDeps, depsMap)
  );
};

export const listAbstractPatchSpecializations = def(
  'listAbstractPatchSpecializations :: Patch -> Project -> [Patch]',
  (abstractPatch, project) => {
    const expectedBaseNameStart = R.compose(
      name => `${name}(`,
      PatchPathUtils.getBaseName,
      Patch.getPatchPath
    )(abstractPatch);

    return R.compose(
      R.filter(
        R.both(
          R.pipe(
            Patch.getPatchPath,
            PatchPathUtils.getBaseName,
            R.startsWith(expectedBaseNameStart)
          ),
          R.pipe(
            Patch.checkSpecializationMatchesAbstraction(abstractPatch),
            Either.isRight
          )
        )
      ),
      listPatches
    )(project);
  }
);

/**
 * Returns a list of dead Links for Node in specified Patch.
 */
const listDeadLinksByNodeId = def(
  'listDeadLinksByNodeId :: NodeId -> Patch -> Project -> [Link]',
  (nodeId, patch, project) =>
    R.compose(
      foldMaybe([], R.identity),
      R.map(node =>
        R.compose(
          deadPinKeys =>
            R.compose(
              R.filter(
                R.either(
                  R.compose(isAmong(deadPinKeys), Link.getLinkInputPinKey),
                  R.compose(isAmong(deadPinKeys), Link.getLinkOutputPinKey)
                )
              ),
              Patch.listLinksByNode
            )(nodeId, patch),
          R.keys,
          R.filter(Pin.isDeadPin),
          getPinsForNode
        )(node, patch, project)
      ),
      Patch.getNodeById
    )(nodeId, patch, project)
);

/**
 * Returns Patch with omitted dead links to specified Node.
 */
export const omitDeadLinksByNodeId = def(
  'omitDeadLinksByNodeId :: NodeId -> Patch -> Project -> Patch',
  (nodeId, patch, project) =>
    R.compose(Patch.omitLinks(R.__, patch), listDeadLinksByNodeId)(
      nodeId,
      patch,
      project
    )
);

// Changes type of a node and preserves links connected to it by changing pin keys.
// Rebinds values of the same type from old pins keys to new.
// Assumes that node exists, and new type is compatible with the current one.
export const changeNodeTypeUnsafe = def(
  'changeNodeTypeUnsafe :: PatchPath -> NodeId -> PatchPath -> Project -> Project',
  (patchPath, nodeId, newNodeType, project) => {
    const patch = getPatchByPathUnsafe(patchPath, project);
    const node = Patch.getNodeByIdUnsafe(nodeId, patch);
    const patchFrom = R.compose(
      getPatchByPathUnsafe(R.__, project),
      Node.getNodeType
    )(node);
    const patchTo = getPatchByPathUnsafe(newNodeType, project);

    const mapOfCorrespondingPinKeys = Patch.getMapOfCorrespondingPinKeys(
      node,
      patchFrom,
      patchTo
    );

    const updatedLinks = Patch.getUpdatedLinksForNodeWithChangedType(
      nodeId,
      oldPinKey => mapOfCorrespondingPinKeys[oldPinKey] || oldPinKey,
      patch
    );

    const updatedNode = R.compose(
      R.converge(
        R.reduce((resultingNode, [pinKeyFrom, boundValue]) => {
          const pinKeyTo = mapOfCorrespondingPinKeys[pinKeyFrom];
          if (R.isNil(pinKeyTo)) return resultingNode;

          if (!Utils.isValidLiteral(boundValue)) return resultingNode;

          const pinTypeFrom = Utils.getTypeFromLiteralUnsafe(boundValue);

          const maybePinTo = Patch.getVariadicPinByKey(node, pinKeyTo, patchTo);
          if (Maybe.isNothing(maybePinTo)) return resultingNode;
          const pinTo = explodeMaybe(
            "We just checked that it's a Just",
            maybePinTo
          );

          if (!Pin.isPinBindable(pinTo)) return resultingNode;

          const pinTypeTo = Pin.getPinType(pinTo);

          return pinTypeFrom === pinTypeTo || Utils.isGenericType(pinTypeTo)
            ? Node.setBoundValue(pinKeyTo, boundValue, resultingNode)
            : resultingNode;
        }),
        [Node.dropAllBoundValues, R.pipe(Node.getAllBoundValues, R.toPairs)]
      ),
      Node.setNodeType(newNodeType)
    )(node);

    return R.over(
      lensPatch(patchPath),
      R.compose(Patch.upsertLinks(updatedLinks), Patch.assocNode(updatedNode)),
      project
    );
  }
);

/**
 * Returns a list of paths of all patches that are used
 * by a patch with a given path(directly or indirectly)
 */
export const getPatchDependencies = def(
  'getPatchDependencies :: PatchPath -> Project -> [PatchPath]',
  (entryPatchPath, project) =>
    R.compose(R.uniq, R.unnest, R.values, getDependenciesMap)(
      project,
      [entryPatchPath],
      {}
    )
);

/**
 * Validates all patches in the project for validness.
 * @param {Project} project
 * @returns {Either<Error|Project>}
 */
export const validateProject = project =>
  R.compose(
    R.ifElse(Either.isLeft, R.identity, R.always(Either.of(project))),
    R.sequence(Either.of),
    R.map(validatePatchContents(R.__, project)),
    listPatches
  )(project);

/**
 * Validates project and returns boolean value.
 * @param {Project} project
 * @returns {Boolean}
 */
export const isValidProject = R.compose(Either.isRight, validateProject);

export const validatePatchReqursively = def(
  'validatePatchReqursively :: PatchPath -> Project -> Either Error Project',
  (patchPath, project) =>
    R.compose(
      R.map(R.always(project)),
      R.chain(
        R.compose(
          prependTraceToError(patchPath),
          R.sequence(Either.of),
          R.map(
            R.pipe(Node.getNodeType, validatePatchReqursively(R.__, project))
          ),
          Patch.listNodes
        )
      ),
      R.chain(validatePatchContents(R.__, project)),
      failOnNothing('ENTRY_POINT_PATCH_NOT_FOUND_BY_PATH', { patchPath }),
      getPatchByPath
    )(patchPath, project)
);
