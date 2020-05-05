import * as R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

import {
  explodeMaybe,
  reverseLookup,
  maybeProp,
  maybeFind,
  foldEither,
  foldMaybe,
  isAmong,
  fail,
  cppEscape,
  catMaybies,
} from 'xod-func-tools';
import * as XP from 'xod-project';
import { def } from './types';

import { withTetheringInetNode, renderProject } from './templates';
import { LIVENESS } from './constants';

import {
  areTimeoutsEnabled,
  isNodeIdEnabled,
  doesRaiseErrors,
  isDirtienessEnabled,
  getEvaluateOnPinSettings,
  doesCatchErrors,
  findRequireUrls,
} from './directives';

//-----------------------------------------------------------------------------
//
// Utils
//
//-----------------------------------------------------------------------------

// :: x -> Number
const toInt = R.flip(parseInt)(10);

const findPatchByPath = def(
  'findPatchByPath :: PatchPath -> [TPatch] -> TPatch',
  (path, patches) => R.find(R.propEq('patchPath', path), patches)
);

const getPatchByNodeId = def(
  'getPatchByNodeId :: Project -> PatchPath -> [TPatch] -> NodeId -> TPatch',
  (project, entryPath, patches, nodeId) =>
    R.compose(
      findPatchByPath(R.__, patches),
      XP.getNodeType,
      XP.getNodeByIdUnsafe(nodeId),
      XP.getPatchByPathUnsafe
    )(entryPath, project)
);

const toposortProject = def(
  'toposortProject :: PatchPath -> Project -> Either Error Object',
  (path, project) =>
    R.compose(
      R.chain(nodeIdsMap =>
        R.compose(
          R.map(transformedProject => ({
            transformedProject,
            nodeIdsMap,
          })),
          () =>
            XP.updatePatch(path, XP.applyNodeIdMap(R.__, nodeIdsMap), project)
        )(nodeIdsMap)
      ),
      XP.getTopologyMap,
      XP.getPatchByPathUnsafe
    )(path, project)
);

export const hasTetheringInternetNode = def(
  'hasTetheringInternetNode :: TProject -> Boolean',
  R.compose(R.not, R.isNil, withTetheringInetNode, R.prop('nodes'))
);

// :: TProject -> Nullable Int
export const getTetheringInetNodeId = R.compose(
  R.unless(R.isNil, R.prop('id')),
  withTetheringInetNode,
  R.prop('nodes')
);

//-----------------------------------------------------------------------------
//
// Transformers
//
//-----------------------------------------------------------------------------

const pinLabelLens = R.lens(XP.getPinLabel, XP.setPinLabel);

const arrangeTPatchesInTopologicalOrder = def(
  'arrangeTPatchesInTopologicalOrder :: PatchPath -> Project -> Map PatchPath TPatch -> [TPatch]',
  (entryPath, project, tpatchesMap) =>
    R.compose(
      R.map(patchPath => tpatchesMap[patchPath]),
      R.uniq,
      R.map(R.nth(1)),
      R.sortBy(R.head),
      // at this point nodes in entry patch have
      // their order in a toposorted graph as an id
      R.map(
        R.converge(R.pair, [R.pipe(XP.getNodeId, parseInt), XP.getNodeType])
      ),
      XP.listNodes,
      // we already checked that entry patchh exists
      XP.getPatchByPathUnsafe(entryPath)
    )(project)
);

export const commentXodPragmas = def(
  'commentXodPragmas :: String -> String',
  R.replace(/^\s*#\s*pragma\s+XOD\s/gm, '//#pragma XOD ')
);

const convertPatchToTPatch = def(
  'convertPatchToTPatch :: Patch -> TPatch',
  patch => {
    const patchPath = XP.getPatchPath(patch);
    const impl = explodeMaybe(
      `Implementation for ${patchPath} not found`,
      XP.getImpl(patch)
    );

    const isDirtyable = pin =>
      XP.getPinType(pin) === XP.PIN_TYPE.PULSE ||
      isDirtienessEnabled(impl, `${pin.direction}_${pin.label}`);

    const outputs = R.compose(
      R.map(
        R.applySpec({
          type: XP.getPinType,
          pinKey: XP.getPinLabel,
          value: R.compose(XP.defaultValueOfType, XP.getPinType),
          isDirtyable,
          isDirtyOnBoot: R.compose(
            R.not,
            R.equals(XP.PIN_TYPE.PULSE),
            XP.getPinType
          ),
        })
      ),
      R.map(R.over(pinLabelLens, cppEscape)),
      XP.normalizeEmptyPinLabels,
      XP.listOutputPins
    )(patch);

    const inputs = R.compose(
      R.map(
        R.applySpec({
          type: XP.getPinType,
          pinKey: XP.getPinLabel,
          isDirtyable,
        })
      ),
      R.map(R.over(pinLabelLens, cppEscape)),
      XP.normalizeEmptyPinLabels,
      XP.listInputPins
    )(patch);

    const isThisIsThat = {
      isDefer: XP.isDeferNodeType(patchPath),
      isConstant: XP.isConstantNodeType(patchPath),
      usesTimeouts: areTimeoutsEnabled(impl),
      catchesErrors: doesCatchErrors(impl),
      raisesErrors: doesRaiseErrors(impl),
      usesNodeId: isNodeIdEnabled(impl),
    };

    return R.mergeAll([
      isThisIsThat,
      {
        outputs,
        inputs,
        impl: commentXodPragmas(impl),
        patchPath,
        requirements: findRequireUrls(impl),
      },
    ]);
  }
);

// :: Patch -> [PatchPath]
// todo: the name is incorrect
const getReferencedCustomTypes = R.compose(R.map(XP.getPinType), XP.listPins);

const getConstructorPatchPaths = def(
  'getConstructorPatchPaths :: PatchPath -> Project -> Project -> [PatchPath]',
  (entryPath, project, originalProject) => {
    // :: [Patch]
    const usedPatches = R.compose(
      // we are sure that all thote patches exist since running flatten
      R.map(XP.getPatchByPathUnsafe(R.__, project)),
      R.uniq,
      R.map(XP.getNodeType),
      XP.listNodes,
      // we are sure that entry patch exists since running flatten
      XP.getPatchByPathUnsafe(entryPath)
    )(project);

    // :: [PatchPath]
    const referencedCustomTypes = R.compose(
      R.reject(XP.isBuiltInType),
      R.uniq,
      R.chain(getReferencedCustomTypes)
    )(usedPatches);

    // [PatchPath]
    return R.compose(
      R.uniq,
      R.concat(R.__, referencedCustomTypes),
      foldEither(R.always([]), R.reverse),
      // Either [PatchPath]
      // but without referenced custom types
      R.converge(XP.sortGraph, [R.pipe(R.flatten, R.uniq), R.identity]),
      // [[PatchPath, PatchPath]]
      R.unnest,
      R.map(typePath =>
        R.compose(
          R.map(referencedType => [typePath, referencedType]),
          R.reject(R.either(XP.isBuiltInType, R.equals(typePath))),
          R.uniq,
          getReferencedCustomTypes,
          XP.getPatchByPathUnsafe(R.__, originalProject)
        )(typePath)
      )
    )(referencedCustomTypes);
  }
);

const addConstructionPatchesAtTheTop = def(
  'addConstructionPatchesAtTheTop :: [TPatch] -> [PatchPath] -> Project -> [TPatch]',
  (tPatches, constructorsPatchPaths, originalProject) =>
    R.compose(
      R.concat(
        R.__,
        // reject construction patches from a list of used patches
        // cause it will be placed at the top of the graph
        R.reject(
          R.compose(isAmong(constructorsPatchPaths), R.prop('patchPath'))
        )(tPatches)
      ),
      R.map(
        R.compose(
          R.assoc('isConstructor', true), // todo: do this in a separate function?
          convertPatchToTPatch,
          XP.getPatchByPathUnsafe(R.__, originalProject)
        )
      )
    )(constructorsPatchPaths)
);

// :: [TPatch] -> Set PatchPath
const listTemplatableCustomTypes = toposortedTPatches => {
  const constructorPatches = R.filter(
    R.prop('isConstructor'),
    toposortedTPatches
  );

  const templatableCustomTypes = new Set();

  // because patches are toposorted, we can do this in a single pass
  constructorPatches.forEach(({ inputs, patchPath }) => {
    const isTemplatable = R.any(
      ({ type }) =>
        XP.CONSTANT_PIN_TYPES.includes(type) ||
        templatableCustomTypes.has(type),
      inputs
    );

    if (isTemplatable) {
      templatableCustomTypes.add(patchPath);
    }
  });

  return templatableCustomTypes;
};

const assignPinFlags = toposortedTPatches => {
  const templatableCustomTypes = listTemplatableCustomTypes(toposortedTPatches);

  if (R.isEmpty(templatableCustomTypes)) {
    return toposortedTPatches;
  }

  const isTemplatableCustomTypePin = ({ type }) =>
    templatableCustomTypes.has(type);

  return R.map(
    R.compose(
      tPatch =>
        R.over(
          R.lensProp('outputs'),
          R.map(pin => {
            const pinFlags = R.applySpec({
              // "output-self" type is erased in createPinFromTerminalNode
              // (pin type becomes the same as the patch path)
              isOutputSelf: ({ type }) => type === tPatch.patchPath,
              isTemplatableCustomTypePin,
              // Finds matching input, like DEV and DEV'
              shortCirquitInputKey: ({ type, pinKey }) =>
                R.compose(
                  foldMaybe('', R.prop('pinKey')),
                  maybeFind(
                    i => i.type === type && `${i.pinKey}U0027` === pinKey
                  )
                )(tPatch.inputs),
            })(pin);

            return R.merge(pinFlags, pin);
          }),
          tPatch
        ),
      R.over(
        R.lensProp('inputs'),
        R.map(pin =>
          R.assoc(
            'isTemplatableCustomTypePin',
            isTemplatableCustomTypePin(pin),
            pin
          )
        )
      )
    ),
    toposortedTPatches
  );
};

const createTPatches = def(
  'createTPatches :: PatchPath -> Project -> Project -> [TPatch]',
  (entryPath, project, originalProject) =>
    R.compose(
      assignPinFlags,
      // Include constructor patches for custom types
      // that are used without an explicit constructor.
      // Otherwise, generated source code won't have
      // type definitions for them.
      tPatches =>
        R.compose(
          addConstructionPatchesAtTheTop(tPatches, R.__, originalProject),
          getConstructorPatchPaths
        )(entryPath, project, originalProject),
      // patches must appear in the same order
      // as respective nodes in a toposorted graph
      arrangeTPatchesInTopologicalOrder(entryPath, project),
      // :: Map PatchPath TPatch
      R.map(convertPatchToTPatch),
      R.dissoc(entryPath),
      R.indexBy(XP.getPatchPath),
      XP.listGenuinePatches
    )(project)
);

const getPinLabelsMap = def(
  'getPinLabelsMap :: [Pin] -> Map PinKey PinLabel',
  R.compose(R.map(XP.getPinLabel), R.indexBy(XP.getPinKey))
);

const getNodePinsUnsafe = def(
  'getNodePinsUnsafe :: Node -> Project -> [Pin]',
  (node, project) =>
    R.compose(
      explodeMaybe(
        `Can’t get node pins of node ${node}. Referred type missing?`
      ),
      XP.getNodePins
    )(node, project)
);

const getNodePinLabels = def(
  'getNodePinLabels :: Node -> Project -> Map PinKey PinLabel',
  R.compose(
    getPinLabelsMap,
    R.map(R.over(pinLabelLens, cppEscape)),
    XP.normalizeEmptyPinLabels,
    getNodePinsUnsafe
  )
);

// TODO: Remove it when `Project.getBoundValue` will return default values
/**
 * In case when `getBoundValue` doesn't contain a bound value
 * we have to fallback to default pin value.
 */
const getDefaultPinValue = def(
  'getDefaultPinValue :: PinKey -> Node -> Project -> DataValue',
  (pinKey, node, project) =>
    R.compose(
      explodeMaybe(`Can’t find pin with key ${pinKey} for node ${node}"`),
      R.map(R.compose(XP.defaultValueOfType, XP.getPinType)),
      R.chain(XP.getPinByKey(pinKey)),
      XP.getPatchByNode(R.__, project)
    )(node)
);

const getTNodeOutputDestinations = def(
  'getTNodeOutputDestinations :: [Link] -> Project -> PatchPath -> [TNodeOutputDestination]',
  (links, project, entryPath) =>
    R.compose(
      R.values,
      R.mapObjIndexed((linksFromSingleOutputToSameNode, inputNodeId) => {
        const patch = R.compose(
          XP.getPatchByPathUnsafe(R.__, project),
          XP.getNodeType,
          XP.getNodeByIdUnsafe(inputNodeId),
          XP.getPatchByPathUnsafe
        )(entryPath, project);

        const inputPinKeysByLabel = R.compose(
          R.map(XP.getPinKey),
          R.indexBy(R.pipe(XP.getPinLabel, cppEscape, l => `input_${l}`)),
          XP.normalizeEmptyPinLabels,
          XP.listInputPins
        )(patch);

        const doesAffectDirtyness = R.compose(
          ({ enabled, exceptions }) => {
            const inputPinKeys = R.map(
              XP.getLinkInputPinKey,
              linksFromSingleOutputToSameNode
            );

            const exceptionPinKeys = exceptions.map(
              l => inputPinKeysByLabel[l]
            );

            return enabled
              ? !exceptionPinKeys.some(pk => inputPinKeys.includes(pk)) // if not ALL inputs are blacklisted
              : exceptionPinKeys.some(pk => inputPinKeys.includes(pk)); // if at least one input is whitelisted
          },
          getEvaluateOnPinSettings,
          explodeMaybe(
            `Implementation for ${XP.getPatchPath(patch)} not found`
          ),
          XP.getImpl
        )(patch);

        return {
          id: toInt(inputNodeId),
          doesAffectDirtyness,
        };
      }),
      R.groupBy(XP.getLinkInputNodeId)
    )(links)
);

const getTNodeOutputs = def(
  'getTNodeOutputs :: Project -> PatchPath -> Node -> [TNodeOutput]',
  (project, entryPath, node) => {
    const nodeId = XP.getNodeId(node);
    const nodePinLabels = getNodePinLabels(node, project);
    const nodePinTypes = R.compose(
      R.map(XP.getPinType),
      R.indexBy(XP.getPinKey),
      getNodePinsUnsafe
    )(node, project);

    return R.compose(
      R.values,
      R.mapObjIndexed((links, pinKey) => ({
        type: nodePinTypes[pinKey],
        to: getTNodeOutputDestinations(links, project, entryPath),
        pinKey: nodePinLabels[pinKey],
        value: XP.getBoundValue(pinKey, node).getOrElse(
          getDefaultPinValue(pinKey, node, project)
        ),
      })),
      R.groupBy(XP.getLinkOutputPinKey),
      R.filter(XP.isLinkOutputNodeIdEquals(nodeId)),
      XP.listLinksByNode(node),
      XP.getPatchByPathUnsafe
    )(entryPath, project);
  }
);

const getOutputPinLabelByLink = def(
  'getOutputPinLabelByLink :: Project -> Patch -> Link -> PinLabel',
  (project, patch, link) => {
    const pinKey = XP.getLinkOutputPinKey(link);
    return R.compose(
      explodeMaybe(
        `Can’t find pin with key ${pinKey} for link ${link} on patch ${patch}`
      ),
      R.chain(maybeProp(pinKey)),
      R.map(getNodePinLabels(R.__, project)),
      XP.getNodeById(R.__, patch),
      XP.getLinkOutputNodeId
    )(link);
  }
);

const getTPatchOutputByLabel = def(
  'getTPatchOutputByLabel :: PinLabel -> TPatch -> TPatchOutput',
  (pinLabel, tpatch) => R.find(R.propEq('pinKey', pinLabel), tpatch.outputs)
);

const getTNodeInputs = def(
  'getTNodeInputs :: Project -> PatchPath -> [TPatch] -> Node -> [TNodeInput]',
  (project, entryPath, patches, node) => {
    const patch = XP.getPatchByPathUnsafe(entryPath, project);
    const nodeId = XP.getNodeId(node);
    const nodePinLabels = getNodePinLabels(node, project);
    const nodePinTypes = R.compose(
      R.map(XP.getPinType),
      R.indexBy(XP.getPinKey),
      getNodePinsUnsafe
    )(node, project);

    // :: Link -> TPatch
    const getUpstreamNodePatch = R.compose(
      getPatchByNodeId(project, entryPath, patches),
      XP.getLinkOutputNodeId
    );

    // :: Link -> PinLabel
    const getUpstreamPinLabel = getOutputPinLabelByLink(project, patch);

    // :: Link -> TNodeInput
    const constructTNodeInput = R.applySpec({
      type: R.compose(R.prop(R.__, nodePinTypes), XP.getLinkInputPinKey),
      originalPinKey: XP.getLinkInputPinKey,
      pinKey: R.compose(R.prop(R.__, nodePinLabels), XP.getLinkInputPinKey),
      fromNodeId: R.compose(toInt, XP.getLinkOutputNodeId),
      fromPatch: getUpstreamNodePatch,
      fromPinKey: getUpstreamPinLabel,
      fromOutput: R.converge(getTPatchOutputByLabel, [
        getUpstreamPinLabel,
        getUpstreamNodePatch,
      ]),
    });

    return R.compose(
      R.map(constructTNodeInput),
      R.filter(XP.isLinkInputNodeIdEquals(nodeId)),
      XP.listLinksByNode(node)
    )(patch);
  }
);

const calculateUpstreamErrorRaisers = R.compose(
  R.sortBy(R.prop('id')),
  R.values,
  R.reduce((accTNodesMap, tNode) => {
    const inputsWithCalculatedUpstreamErrorRaisers = R.map(tNodeInput => {
      const upstreamRaisersForPin = R.compose(
        R.reject(R.propEq('nodeId', tNode.id)), // could happen with defers
        foldMaybe([], upstreamTNode =>
          R.concat(
            upstreamTNode.patch.raisesErrors
              ? [
                  {
                    nodeId: upstreamTNode.id,
                    pinKey: tNodeInput.fromPinKey,
                  },
                ]
              : [],
            upstreamTNode.patch.catchesErrors
              ? []
              : upstreamTNode.upstreamErrorRaisers
          )
        ),
        R.chain(maybeProp(R.__, accTNodesMap)),
        R.map(R.toString),
        maybeProp('fromNodeId')
      )(tNodeInput);

      return R.assoc('upstreamErrorRaisers', upstreamRaisersForPin, tNodeInput);
    }, tNode.inputs);

    const upstreamErrorRaisers = R.compose(
      R.uniq,
      R.chain(R.prop('upstreamErrorRaisers'))
    )(inputsWithCalculatedUpstreamErrorRaisers);

    const updatedTNode = R.compose(
      R.assoc('inputs', inputsWithCalculatedUpstreamErrorRaisers),
      R.assoc('upstreamErrorRaisers', upstreamErrorRaisers)
    )(tNode);

    return R.assoc(tNode.id, updatedTNode, accTNodesMap);
  }, {}),
  R.converge(R.concat, [R.filter(R.path(['patch', 'isDefer'])), R.identity])
);

const calculateNearestDownstreamErrorCatchers = tNodes => {
  const tNodesById = R.indexBy(R.prop('id'), tNodes);

  function findDownstreamErrorCatchersForOutput(tNodeOutput) {
    return R.compose(
      R.chain(downStreamNodeId => {
        const downstreamTNode = tNodesById[downStreamNodeId];

        return downstreamTNode.patch.catchesErrors
          ? [downstreamTNode.id]
          : R.chain(
              findDownstreamErrorCatchersForOutput,
              downstreamTNode.outputs
            );
      }),
      R.map(R.prop('id')),
      R.propOr([], 'to')
    )(tNodeOutput);
  }

  return R.map(tNode => {
    if (!tNode.patch.raisesErrors) return tNode;

    return R.over(
      R.lensProp('outputs'),
      R.map(tNodeOutput => {
        const nearestDownstreamCatchers = R.compose(
          R.uniq,
          findDownstreamErrorCatchersForOutput
        )(tNodeOutput);

        return R.assoc(
          'nearestDownstreamCatchers',
          nearestDownstreamCatchers,
          tNodeOutput
        );
      }),
      tNode
    );
  }, tNodes);
};

const createTNodes = def(
  'createTNodes :: PatchPath -> [TPatch] -> Map NodeId String -> Project -> [TNode]',
  (entryPath, patches, nodeIdsMap, project) =>
    R.compose(
      calculateNearestDownstreamErrorCatchers,
      calculateUpstreamErrorRaisers,
      R.sortBy(R.prop('id')),
      R.map(
        R.applySpec({
          id: R.compose(toInt, XP.getNodeId),
          originalId: R.compose(reverseLookup(R.__, nodeIdsMap), XP.getNodeId),
          patch: R.compose(findPatchByPath(R.__, patches), XP.getNodeType),
          outputs: getTNodeOutputs(project, entryPath),
          inputs: getTNodeInputs(project, entryPath, patches),
        })
      ),
      XP.listNodes,
      XP.getPatchByPathUnsafe
    )(entryPath, project)
);

/**
 * Leaves only patches that are used in an entry patch(and entry patch itself).
 * Assumes that entry patch is flattened.
 */
const removeUnusedNodes = def(
  'removeUnusedNodes :: PatchPath -> Project -> Project',
  (flatEntryPatchPath, project) => {
    const nodeTypesUsedInEntryPatch = R.compose(
      R.uniq,
      R.map(XP.getNodeType),
      XP.listNodes,
      // we already checked several times that entry patch exists
      XP.getPatchByPathUnsafe(flatEntryPatchPath)
    )(project);

    const unusedPatchPaths = R.compose(
      R.without([...nodeTypesUsedInEntryPatch, flatEntryPatchPath]),
      R.map(XP.getPatchPath),
      XP.listPatches
    )(project);

    return XP.omitPatches(unusedPatchPaths, project);
  }
);

const checkForNativePatchesWithTooManyOutputs = def(
  'checkForNativePatchesWithTooManyOutputs :: TProject -> Either Error TProject',
  tProject => {
    const nodeWithTooManyOutputs = R.find(
      R.pipe(R.prop('outputs'), R.length, R.lt(7)),
      tProject.patches
    );

    if (nodeWithTooManyOutputs) {
      return fail('TOO_MANY_OUTPUTS_FOR_NATIVE_NODE', {
        patchPath: nodeWithTooManyOutputs.patchPath,
      });
    }

    return Either.of(tProject);
  }
);

const getGlobalNamesFromTProject = def(
  'getGlobalNamesFromTProject :: TProject -> [String]',
  R.compose(
    R.map(R.tail), // get rid of leading `=`
    R.uniq,
    R.filter(R.startsWith('=')),
    R.pluck('value'),
    R.unnest,
    R.pluck('outputs'),
    R.prop('nodes')
  )
);

/**
 * Transforms Project into TProject.
 * TProject is an object, that ready to be passed into renderer (handlebars)
 * and it has a ready-to-use values, nothing needed to compute anymore.
 */
const transformProjectWithImpls = def(
  'transformProjectWithImpls :: Project -> PatchPath -> Liveness -> Either Error TProject',
  (project, path, liveness) =>
    R.compose(
      R.chain(checkForNativePatchesWithTooManyOutputs),
      // Fill `globals` array with { key: globName } objects for each global referred in the project
      R.map(tProject =>
        R.compose(
          R.assocPath(['config', 'globals'], R.__, tProject),
          R.map(globalName => ({ key: globalName })),
          getGlobalNamesFromTProject
        )(tProject)
      ),
      // :: Either Error TProject
      R.map(({ transformedProject, nodeIdsMap }) => {
        const patches = createTPatches(path, transformedProject, project);
        return R.merge(
          {
            config: {
              XOD_DEBUG: liveness === LIVENESS.DEBUG,
              XOD_SIMULATION: liveness === LIVENESS.SIMULATION,
              globals: [],
            },
          },
          R.applySpec({
            patches: R.always(patches),
            nodes: createTNodes(path, patches, nodeIdsMap),
          })(transformedProject)
        );
      }),
      R.chain(toposortProject(path)),
      // end preparing project for transpilation. TODO: extract it into a separate function
      R.map(removeUnusedNodes(path)),
      R.chain(XP.squashTetheringNodes(path)),
      R.map(XP.extractBoundInputsToConstNodes(path)),
      R.chain(XP.flatten(R.__, path)),
      R.map(XP.expandVariadicNodes(path)),
      R.map(XP.linkifyPatchRecursively(path)),
      R.chain(XP.autoresolveTypes(path)),
      R.unless(
        () => liveness !== LIVENESS.NONE,
        R.map(XP.removeDebugNodes(path))
      ),
      XP.validatePatchReqursively(path)
      // begin preparing project for transpilation
    )(project)
);

export const getNodeIdsMap = def(
  'getNodeIdsMap :: TProject -> Map NodeId String',
  R.compose(
    R.fromPairs,
    R.map(node => [node.originalId, String(node.id)]),
    R.prop('nodes')
  )
);

export const getNodePinKeysMap = def(
  'getNodePinKeysMap :: TProject -> Map NodeId [PinKey]',
  R.compose(
    R.fromPairs,
    R.map(node => [node.originalId, R.pluck('pinKey', node.patch.outputs)]),
    R.prop('nodes')
  )
);

const getParentPatch = def(
  'getParentPatch :: NodeId -> Patch -> Project -> Maybe Patch',
  (fullNodeId, rootPatch, project) =>
    R.compose(
      R.reduce(
        (parentPatch, nodeId) =>
          R.chain(
            R.compose(
              R.chain(XP.getPatchByNode(R.__, project)),
              XP.getNodeById(nodeId)
            ),
            parentPatch
          ),
        Maybe(rootPatch)
      ),
      R.init,
      R.split('~')
    )(fullNodeId)
);

/**
 * Utility function to get upstream pin pairs
 *
 * Accepts the intermediate object `ExtendedTInput`:
 * {
 *   originalPinKey: PinKey,
 *   upstreamErrorRaisers: [Int],
 *   ownerNodeId: NodeId,          // chained, like `aa~bb~cc`
 *   ownerNodeType: PatchPath,
 * }
 *
 * Returns another intermediate object `PinPairGroup`:
 * {
 *   pinPairs: [Pair Pin Node],   // Node with updated id (chained), like `aa~bb~cc`
 *   upstreamErrorRaisers: [Int],
 *   parentNodeId: NodeId,        // chained
 *   parentPatch: Patch,
 * }
 */
const getUpstreamPinPairsByPinPair = def(
  'getUpstreamPinPairsByPinPair :: Patch -> Project -> Object -> Maybe Object',
  (
    currentPatch,
    project,
    { originalPinKey, upstreamErrorRaisers, ownerNodeId, ownerNodeType }
  ) => {
    const parentNodeId = R.compose(R.join('~'), R.init, R.split('~'))(
      ownerNodeId
    );
    const finalNodeId = R.compose(R.last, R.split('~'))(ownerNodeId);
    const maybeParentPatch = getParentPatch(ownerNodeId, currentPatch, project);
    const maybeNode = R.chain(XP.getNodeById(finalNodeId), maybeParentPatch);
    const maybeNodePatch = XP.getPatchByPath(ownerNodeType, project);
    const maybePin = R.chain(XP.getPinByKey(originalPinKey), maybeNodePatch);

    return R.compose(
      R.map(([pin, node, parentPatch]) =>
        R.compose(
          pinPairs => ({
            pinPairs,
            upstreamErrorRaisers,
            parentNodeId,
            parentPatch,
          }),
          XP.listUpstreamPinsToNiix(R.__, parentPatch, project)
        )([[pin, node]])
      ),
      R.sequence(Maybe.of)
    )([maybePin, maybeNode, maybeParentPatch]);
  }
);

// Object :: { nodeId: NodeId, pinKey: PinKey }
const createAffectedPinsTree = def(
  'createAffectedPinsTree :: [Object] -> [Pair PinKey NodeId] -> [Map Number (Map PinKey [Pair PinKey NodeId])]',
  (upstreamErrorRaisers, pairs) =>
    R.reduce(
      (acc, errRaiser) =>
        R.over(
          R.lensProp(errRaiser.nodeId),
          R.compose(
            R.over(
              R.lensProp(errRaiser.pinKey),
              R.compose(R.concat(pairs), R.defaultTo([]))
            ),
            R.defaultTo({})
          ),
          acc
        ),
      {}
    )(upstreamErrorRaisers)
);

export const getPinsAffectedByErrorRaisers = def(
  'getPinsAffectedByErrorRaisers :: TProject -> Patch -> Project -> Map Number (Map PinKey [Pair PinKey NodeId])',
  (tProject, currentPatch, project) => {
    const hasNoUpstreamErrorRaisers = R.propSatisfies(
      R.isEmpty,
      'upstreamErrorRaisers'
    );

    const convertPinPairGroupsToPinPairs = R.compose(
      R.reduce((acc, next) => R.mergeDeepWith(R.concat, acc, next), {}),
      R.map(pinPairsGroup =>
        R.compose(
          createAffectedPinsTree(pinPairsGroup.upstreamErrorRaisers),
          R.map(
            R.compose(
              R.over(R.lensIndex(0), XP.getPinKey),
              R.over(
                R.lensIndex(1),
                R.pipe(
                  XP.getNodeId,
                  nId =>
                    pinPairsGroup.parentPatch === currentPatch
                      ? nId
                      : `${pinPairsGroup.parentNodeId}~${nId}`
                )
              )
            )
          )
        )(pinPairsGroup.pinPairs)
      )
    );

    return R.compose(
      // Convert intermediate PinPairGroups into PinPairs:
      convertPinPairGroupsToPinPairs,
      // Get upstream PinPairGroups for all pin pairs that ended traversing on
      // the input terminal, because it traverses inside the patch and can't get
      // on the upper level.
      // This step ensures that we have a full chain of upstream pin pairs:
      R.reduce((acc, pinPairsGroup) => {
        const parentInputPinKeys = R.compose(
          R.map(XP.getPinKey),
          XP.listInputPins
        )(pinPairsGroup.parentPatch);

        return R.ifElse(
          () =>
            // composite patch upstream nodes ended on input terminal
            !XP.isPatchNotImplementedInXod(pinPairsGroup.parentPatch) &&
            R.any(
              R.compose(
                R.both(
                  R.compose(XP.isInputTerminalPath, XP.getNodeType),
                  R.compose(isAmong(parentInputPinKeys), XP.getNodeId)
                ),
                R.nth(1)
              )
            )(pinPairsGroup.pinPairs),
          R.compose(
            R.concat(R.__, acc),
            R.append(pinPairsGroup),
            catMaybies,
            R.map(([_, node]) =>
              getUpstreamPinPairsByPinPair(currentPatch, project, {
                originalPinKey: XP.getNodeId(node),
                upstreamErrorRaisers: pinPairsGroup.upstreamErrorRaisers,
                ownerNodeId: pinPairsGroup.parentNodeId,
                ownerNodeType: XP.getPatchPath(pinPairsGroup.parentPatch),
              })
            ),
            R.filter(
              R.compose(isAmong(parentInputPinKeys), XP.getNodeId, R.nth(1))
            ),
            R.prop('pinPairs')
          ),
          R.append(R.__, acc)
        )(pinPairsGroup);
      }, []),
      // Get upstream PinPairGroups for them:
      catMaybies,
      R.map(getUpstreamPinPairsByPinPair(currentPatch, project)),
      // Prepare ExtendedTInput objects:
      R.reduce(
        (acc, tNode) =>
          R.compose(
            R.concat(acc),
            R.map(tInput => ({
              originalPinKey: tInput.originalPinKey,
              upstreamErrorRaisers: tInput.upstreamErrorRaisers,
              ownerNodeId: tNode.originalId,
              ownerNodeType: tNode.patch.patchPath,
            })),
            R.reject(hasNoUpstreamErrorRaisers),
            R.values,
            R.prop('inputs')
          )(tNode),
        []
      ),
      R.reject(hasNoUpstreamErrorRaisers),
      R.prop('nodes')
    )(tProject);
  }
);

export const listGlobals = def(
  'listGlobals :: TProject -> [String]',
  R.compose(R.pluck('key'), R.path(['config', 'globals']))
);

export const extendTProjectWithGlobals = def(
  'extendTProjectWithGlobals :: StrMap String -> TProject -> Either TProject Error',
  (globals, tProject) => {
    const globalsUsedInProject = getGlobalNamesFromTProject(tProject);
    const keysToSet = R.keys(globals);

    const missedKey = R.find(
      R.complement(R.contains(R.__, keysToSet)),
      globalsUsedInProject
    );
    if (missedKey)
      return fail('GLOBAL_LITERAL_VALUE_MISSING', { key: missedKey });

    return R.compose(
      Either.of,
      R.assocPath(['config', 'globals'], R.__, tProject),
      R.map(R.applySpec({ key: R.nth(0), value: R.nth(1) })),
      R.toPairs
    )(globals);
  }
);

export const transformProject = def(
  'transformProject :: Project -> PatchPath -> Liveness -> Either Error TProject',
  transformProjectWithImpls
);

export const getRequireUrls = def(
  'getRequireUrls :: TProject -> [String]',
  R.compose(R.uniq, R.unnest, R.pluck('requirements'), R.prop('patches'))
);

export const transpile = renderProject;
