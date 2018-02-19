import * as R from 'ramda';
import { Either, Maybe } from 'ramda-fantasy';
import { explodeMaybe, notEmpty, isAmong } from 'xod-func-tools';
import { BUILT_IN_PATCH_PATHS } from './builtInPatches';

import * as CONST from './constants';
import * as Tools from './func-tools';
import * as Link from './link';
import * as Node from './node';
import * as Patch from './patch';
import * as PatchPathUtils from './patchPathUtils';
import { def } from './types';
import * as Utils from './utils';

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
export const createProject = def(
  'createProject :: () -> Project',
  () => ({
    '@@type': 'xod-project/Project',
    authors: [],
    description: '',
    license: '',
    version: '0.0.0',
    patches: {},
    name: '',
  })
);

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
    R.over(R.lensProp('patches'), R.map(
      R.compose(
        R.over(R.lensProp('nodes'), R.map(R.assoc('@@type', 'xod-project/Node'))),
        R.over(R.lensProp('links'), R.map(R.assoc('@@type', 'xod-project/Link'))),
        R.assoc('@@type', 'xod-project/Patch')
      )
    )),
    R.assoc('@@type', 'xod-project/Project')
  )
);

// =============================================================================
//
// Patches
//
// =============================================================================

/*
 Just empty patches.
 Pins etc will be hardcoded elsewhere.
 */
export const BUILT_IN_PATCHES = R.compose(
  R.indexBy(Patch.getPatchPath),
  R.map(
    path =>
      R.pipe(
        Patch.createPatch,
        Patch.setPatchPath(path)
      )()
  )
)(BUILT_IN_PATCH_PATHS);

// :: String -> Boolean
export const isPathBuiltIn = R.flip(R.contains)(BUILT_IN_PATCH_PATHS);

const getPatches =
  R.compose(
    R.merge(BUILT_IN_PATCHES),
    R.prop('patches')
  );

/**
 * @function lensPatch
 * @param {String} patchId
 * @returns {Lens} a Ramda lens whose focus is a patch with the specified id.
 */
export const lensPatch = patchId =>
  R.compose(
    R.lens(getPatches, R.assoc('patches')),
    R.lensProp(patchId)
  );

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
 * @function listPatchesWithoutBuiltIns
 * @param {Project} project - project bundle
 * @returns {Patch[]} list of patches that were added to project, excluding built-ins
 */
export const listPatchesWithoutBuiltIns = def(
  'listPatches :: Project -> [Patch]',
  R.compose(
    R.reject(R.compose(
      isAmong(BUILT_IN_PATCH_PATHS),
      Patch.getPatchPath
    )),
    R.values,
    R.prop('patches')
  )
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
    R.reject(R.either(
      PatchPathUtils.isBuiltInLibName,
      PatchPathUtils.isLocalMarker
    )),
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
    listPatchesWithoutBuiltIns
  )
);

/**
 * Returns a list of Library Names that used somewhere in the project
 * patches (local or library) as Nodes.
 */
export const listMissingLibraryNames = def(
  'listMissingLibraryNames :: Project -> [LibName]',
  R.converge(
    R.difference,
    [
      listLibraryNamesUsedInProject,
      listInstalledLibraryNames,
    ]
  )
);

/**
 * @function getPatchByPath
 * @param {string} path - full path of the patch to find, e.g. `"@/bar"`
 * @param {Project} project - project bundle
 * @returns {Maybe<Patch>} a patch with given path
 */
export const getPatchByPath = def(
  'getPatchByPath :: PatchPath -> Project -> Maybe Patch',
  (path, project) => R.compose(
    Tools.prop(path),
    getPatches
  )(project)
);

/**
 * @function getPatchByPathUnsafe
 * @param {string} path - full path of the patch to find, e.g. `"@/foo"`
 * @param {Project} project - project bundle
 * @returns {Patch} a patch with given path
 * @throws Error if patch was not found
 */
export const getPatchByPathUnsafe = def(
  'getPatchByPath :: PatchPath -> Project -> Patch',
  (path, project) => explodeMaybe(
    Utils.formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, { patchPath: path }),
    getPatchByPath(path, project)
  )
);

/**
 * Checks project for existence of patches and pins that used in link.
 *
 * @private
 * @function checkPinKeys
 * @param {Link} link
 * @param {Patch} patch
 * @param {Project} project
 * @returns {Either<Error|Patch>}
 */
const checkPinKeys = def(
  'checkPinKeys :: Link -> Patch -> Project -> Either Error Patch',
  (link, patch, project) => {
    // TODO: Move check function and child functions on the top-level
    const check = (nodeIdGetter, pinKeyGetter) => {
      const pinKey = pinKeyGetter(link);
      // :: patch -> Either
      const checkPinExists = R.compose(
        Tools.errOnNothing(CONST.ERROR.PINS_NOT_FOUND),
        Patch.getPinByKey(pinKey)
      );
      // :: node -> Either
      const checkTypeExists = R.compose(
        type => R.compose(
          Tools.errOnNothing(
            Utils.formatString(
              CONST.ERROR.TYPE_NOT_FOUND,
              { type }
            )
          ),
          getPatchByPath(R.__, project)
        )(type),
        Node.getNodeType
      );
      // :: link -> Either
      const checkNodeExists = R.curry(R.compose(
        nodeId => Tools.errOnNothing(
          Utils.formatString(
            CONST.ERROR.NODE_NOT_FOUND,
            { nodeId, patchPath: Patch.getPatchPath(patch) }
          ),
          Patch.getNodeById(nodeId, patch)
        ),
        nodeIdGetter
      ));

      return R.compose(
        R.chain(checkPinExists),
        R.chain(checkTypeExists),
        checkNodeExists
      )(link);
    };

    return check(Link.getLinkInputNodeId, Link.getLinkInputPinKey).chain(
      () => check(Link.getLinkOutputNodeId, Link.getLinkOutputPinKey)
    ).map(R.always(patch));
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
// TODO: Try to simplify this mess :-D
export const validatePatchContents = def(
  'validatePatchContents :: Patch -> Project -> Either Error Patch',
  (patch, project) => {
    // :: patch -> Either Error Patch
    const checkNodeTypes = R.compose(
      R.map(R.always(patch)),
      R.sequence(Either.of),
      R.chain(
        R.compose(
          type => R.compose(
            Tools.errOnNothing(
              Utils.formatString(
                CONST.ERROR.TYPE_NOT_FOUND,
                { type }
              )
            ),
            getPatchByPath(R.__, project)
          )(type),
          Node.getNodeType
        )
      ),
      Patch.listNodes
    );
    // :: patch -> Either Error Patch
    const checkLinks = R.compose(
      R.ifElse(
        R.compose(
          R.gt(R.__, 0),
          R.length
        ),
        R.compose(
          R.prop(0),
          R.chain(R.partialRight(checkPinKeys, [patch, project]))
        ),
        R.always(
          Either.of(patch)
        )
      ),
      Patch.listLinks
    );

    return checkNodeTypes(patch)
      .chain(checkLinks)
      .chain(Patch.validatePatchForVariadics);
  }
);

/**
 * Inserts or updates the `patch` within the `project`
 * without any validation.
 *
 * Matching is done by patch’es path.
 *
 * @function assocPatchUnsafe
 * @param {string} path
 * @param {Patch} patch - patch to insert or update
 * @param {Project} project - project to operate on
 * @returns {Project} copy of the project with the updated patch
 */
export const assocPatchUnsafe = def(
  'assocPatchUnsafe :: PatchPath -> Patch -> Project -> Project',
  (path, patch, project) => R.compose(
    R.assocPath(['patches', path], R.__, project),
    Patch.setPatchPath(path)
  )(patch)
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
 * @returns {Either<Error|Project>} copy of the project with the updated patch
 */
export const assocPatch = def(
  'assocPatch :: PatchPath -> Patch -> Project -> Either Error Project',
  (path, patch, project) =>
  validatePatchContents(patch, project).map(
    assocPatchUnsafe(path, R.__, project)
  )
);

/**
 * Inserts or updates a list of Patches within the Project.
 * It takes a PatchPath from the Patches in the list.
 * Without validation of each patch.
 */
export const assocPatchListUnsafe = def(
  'assocPatchListUnsafe :: [Patch] -> Project -> Project',
  (patches, project) => R.compose(
    R.reduce((proj, fn) => fn(proj), project),
    R.map(
      R.converge(
        assocPatchUnsafe,
        [
          Patch.getPatchPath,
          R.identity,
        ]
      )
    )
  )(patches)
);

/**
 * Inserts or updates a list of Patches within the Project.
 * It takes a PatchPath from the Patches in the list.
 * With validation of each patch.
 */
export const assocPatchList = def(
  'assocPatchList :: [Patch] -> Project -> Either Error Project',
  (patches, project) => R.compose(
    R.reduce(R.flip(R.chain), Either.of(project)),
    R.map(
      R.converge(
        assocPatch,
        [
          Patch.getPatchPath,
          R.identity,
        ]
      )
    )
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
    // TODO: perform validation or switch to 'make a blueprint and then validate all' paradigm?
    R.over(
      R.lensProp('patches'),
      R.flip(R.merge)(
        R.indexBy(Patch.getPatchPath, patches)
      ),
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
  (path, project) =>
    R.dissocPath(['patches', path], project)
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
  (paths, project) =>
    R.over(
      R.lensProp('patches'),
      R.omit(paths),
      project
    )
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
    (isPathBuiltIn(oldPath)
      ? Tools.err(CONST.ERROR.PATCH_REBASING_BUILT_IN)()
      : Either.of(newPath)
    ).chain(
      Tools.errOnFalse(
        CONST.ERROR.PATCH_PATH_OCCUPIED,
        R.complement(doesPathExist(R.__, project))
      )
    )
    .chain(() => Tools.errOnNothing(
      Utils.formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, { patchPath: oldPath }),
      getPatchByPath(oldPath, project)
    ))
    .map(R.always(project))
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
    validatePatchRebase(newPath, oldPath, project)
      .map(
        (proj) => {
          const patch = getPatchByPath(oldPath, proj).map(Patch.setPatchPath(newPath));
          const assocThatPatch = patch.chain(R.assocPath(['patches', newPath]));

          // TODO: Think about refactoring that piece of code :-D
          // Patch -> Patch
          const updateReferences = R.when(
            R.has('nodes'),
            R.evolve({
              nodes: R.mapObjIndexed(
                R.when(
                  R.propEq('type', oldPath),
                  R.assoc('type', newPath)
                )
              ),
            })
          );

          return R.compose(
            R.evolve({
              patches: R.mapObjIndexed(updateReferences),
            }),
            R.dissocPath(['patches', oldPath]),
            assocThatPatch
          )(proj);
        }
      )
);

/**
 * Updates patch inside Project and returns Either Error Project.
 * It's a safe version of `R.over(lensPatch('some-patch'), someFn, project);`
 */
export const updatePatch = def(
  'updatePatch :: PatchPath -> (Patch -> Patch) -> Project -> Either Error Project',
  (patchPath, updateFunction, project) => R.compose(
    R.chain(assocPatch(patchPath, R.__, project)),
    R.map(updateFunction),
    Tools.errOnNothing(
      Utils.formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, { patchPath })
    ),
    getPatchByPath
  )(patchPath, project)
);

// =============================================================================
//
// Getters with traversing through project
//
// =============================================================================
/**
 * Returns `Maybe Patch`, that is defined as a type of the Node.
 * If specified Project contains specified Node it will return
 * `Just Patch` guaranteed. Otherwise it could be `Nothing`.
 */
export const getPatchByNode = def(
  'getPatchByNode :: Node -> Project -> Maybe Patch',
  (node, project) => R.compose(
    getPatchByPath(R.__, project),
    Node.getNodeType
  )(node)
);
/**
 * Returns Maybe list of Pins, computed from the Patch,
 * that is defined as a type of the specified Node.
 */
export const getNodePins = def(
  'getNodePins :: Node -> Project -> Maybe [Pin]',
  (node, project) => R.compose(
    R.map(Patch.listPins),
    getPatchByNode(R.__, project)
  )(node)
);
/**
 * Returns Maybe Pin, extracted from the Patch,
 * that is defined as a type of the Node.
 */
export const getNodePin = def(
  'getNodePin :: PinKey -> Node -> Project -> Maybe Pin',
  (pinKey, node, project) => R.compose(
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
  (nodeId, patch, project) => R.compose(
    R.chain(getPatchByPath(R.__, project)),
    R.map(Node.getNodeType),
    Patch.getNodeById(R.__, patch)
  )(nodeId)
);
export const getPatchByNodeIdUnsafe = def(
  'getPatchByNodeIdUnsafe :: NodeId -> Patch -> Project -> Patch',
  (nodeId, patch, project) => R.compose(
    explodeMaybe(
      Utils.formatString(
        CONST.ERROR.CANT_GET_PATCH_BY_NODEID,
        {
          nodeId,
          patchPath: Patch.getPatchPath(patch),
        }
      )
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
  (terminalNodeId, patchPath, project) => R.compose(
    R.any(
      patch => R.compose(
        notEmpty,
        R.chain(node => Patch.listLinksByPin(terminalNodeId, node, patch)),
        R.filter(R.compose(
          R.equals(patchPath),
          Node.getNodeType
        )),
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
  project => R.compose(
    assocPatchListUnsafe(R.__, project),
    R.map(Patch.resolveNodeTypesInPatch),
    R.filter(R.compose(
      R.any(Node.isLocalNode),
      Patch.listNodes
    )),
    listLibraryPatches
  )(project)
);

/**
 * Returns a map of Pins for the passed Node.
 *
 * If Node points to unexistent Patch, so Pins will be calculated
 * from Links, connected with it, with "UNKNOWN" type.
 * Such Nodes will be marked as dead.
 *
 * If Patch exists — it gets Pins from Patch and ensures, that all Links
 * conntected with specified Node really has a Pin. If not — it will
 * add pins with Unknown type (to render it properly).
 * Such Links will be marked as dead, but Nodes — not.
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
          R.map(R.compose(
            Patch.upsertDeadPins(node, currentPatch),
            Patch.getNondeadNodePins(node)
          ))
        ),
        () => Patch.getDeadNodePins(node, currentPatch)
      ),
      getPatchByPath
    )(type, project);
  }
);


/**
 * Validates all patches in the project for validness.
 * @param {Project} project
 * @returns {Either<Error|Project>}
 */
export const validateProject = project => R.compose(
  R.ifElse(
    Either.isLeft,
    R.identity,
    R.always(Either.of(project))
  ),
  R.sequence(Either.of),
  R.map(validatePatchContents(R.__, project)),
  listPatches
)(project);

/**
 * Validates project and returns boolean value.
 * @param {Project} project
 * @returns {Boolean}
 */
export const isValidProject = R.compose(
  Either.isRight,
  validateProject
);
