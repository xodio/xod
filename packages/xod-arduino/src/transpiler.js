import * as R from 'ramda';
import { Either } from 'ramda-fantasy';

import {
  explodeMaybe,
  reverseLookup,
  maybeProp,
  foldEither,
  isAmong,
} from 'xod-func-tools';
import * as XP from 'xod-project';
import { def } from './types';

import { renderProject } from './templates';
import { DEFAULT_TRANSPILATION_OPTIONS } from './constants';

import {
  areTimeoutsEnabled,
  isNodeIdEnabled,
  isDirtienessEnabled,
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

const getLinksInputNodeIds = def(
  'getLinksInputNodeIds :: [Link] -> [TNodeId]',
  R.compose(R.uniq, R.map(R.compose(toInt, XP.getLinkInputNodeId)))
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

//-----------------------------------------------------------------------------
//
// Transformers
//
//-----------------------------------------------------------------------------

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
      XP.normalizeEmptyPinLabels,
      XP.listInputPins
    )(patch);

    const isThisIsThat = {
      isDefer: XP.isDeferNodeType(patchPath),
      isConstant: XP.isConstantNodeType(patchPath),
      usesTimeouts: areTimeoutsEnabled(impl),
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
          convertPatchToTPatch,
          XP.getPatchByPathUnsafe(R.__, originalProject)
        )
      )
    )(constructorsPatchPaths)
);

const createTPatches = def(
  'createTPatches :: PatchPath -> Project -> Project -> [TPatch]',
  (entryPath, project, originalProject) =>
    R.compose(
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
  R.compose(getPinLabelsMap, XP.normalizeEmptyPinLabels, getNodePinsUnsafe)
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

const getTNodeOutputs = def(
  'getTNodeOutputs :: Project -> PatchPath -> Node -> [TNodeOutput]',
  (project, entryPath, node) => {
    const nodeId = XP.getNodeId(node);
    const nodePins = getNodePinLabels(node, project);

    return R.compose(
      R.values,
      R.mapObjIndexed((links, pinKey) => ({
        to: getLinksInputNodeIds(links),
        pinKey: nodePins[pinKey],
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
    const nodePins = getNodePinLabels(node, project);

    // :: Link -> TPatch
    const getUpstreamNodePatch = R.compose(
      getPatchByNodeId(project, entryPath, patches),
      XP.getLinkOutputNodeId
    );

    // :: Link -> PinLabel
    const getUpstreamPinLabel = getOutputPinLabelByLink(project, patch);

    // :: Link -> TNodeInput
    const constructTNodeInput = R.applySpec({
      pinKey: R.compose(R.prop(R.__, nodePins), XP.getLinkInputPinKey),
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

const createTNodes = def(
  'createTNodes :: PatchPath -> [TPatch] -> Map NodeId String -> Project -> [TNode]',
  (entryPath, patches, nodeIdsMap, project) =>
    R.compose(
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
      return Either.Left(
        new Error(
          `Native node ${
            nodeWithTooManyOutputs.patchPath
          } has more than 7 outputs`
        )
      );
    }

    return Either.of(tProject);
  }
);

/**
 * Transforms Project into TProject.
 * TProject is an object, that ready to be passed into renderer (handlebars)
 * and it has a ready-to-use values, nothing needed to compute anymore.
 */
const transformProjectWithImpls = def(
  'transformProjectWithImpls :: Project -> PatchPath -> TranspilationOptions -> Either Error TProject',
  (project, path, opts) =>
    R.compose(
      R.chain(checkForNativePatchesWithTooManyOutputs),
      // :: Either Error TProject
      R.map(({ transformedProject, nodeIdsMap }) => {
        const patches = createTPatches(path, transformedProject, project);

        return R.merge(
          {
            config: { XOD_DEBUG: opts.debug },
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
      R.map(XP.extractBoundInputsToConstNodes(path)),
      R.chain(XP.flatten(R.__, path)),
      R.map(XP.expandVariadicNodes(path)),
      R.chain(XP.autoresolveTypes(path)),
      R.unless(
        () => opts.debug,
        R.chain(XP.updatePatch(path, XP.removeDebugNodes))
      ),
      R.map(XP.jumperizePatchRecursively(path)),
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

export const transformProject = def(
  'transformProject :: Project -> PatchPath -> Either Error TProject',
  (project, patchPath) =>
    transformProjectWithImpls(project, patchPath, DEFAULT_TRANSPILATION_OPTIONS)
);

export const transformProjectWithDebug = def(
  'transformProjectWithDebug :: Project -> PatchPath -> Either Error TProject',
  (project, patchPath) => {
    const options = R.merge(DEFAULT_TRANSPILATION_OPTIONS, {
      debug: true,
    });
    return transformProjectWithImpls(project, patchPath, options);
  }
);

export const getRequireUrls = def(
  'getRequireUrls :: TProject -> [String]',
  R.compose(R.uniq, R.unnest, R.pluck('requirements'), R.prop('patches'))
);

export const transpile = renderProject;
