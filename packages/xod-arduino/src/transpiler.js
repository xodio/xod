import R from 'ramda';
import { Either } from 'ramda-fantasy';

import { explodeMaybe, reverseLookup } from 'xod-func-tools';
import * as Project from 'xod-project';
import { def } from './types';

import { renderProject } from './templates';
import { DEFAULT_TRANSPILATION_OPTIONS } from './constants';

const ARDUINO_IMPLS = ['cpp', 'arduino'];

//-----------------------------------------------------------------------------
//
// Utils
//
//-----------------------------------------------------------------------------

// :: x -> Number
const toInt = R.flip(parseInt)(10);

const getNodeCount = def(
  'getNodeCount :: Patch -> Number',
  R.compose(
    R.length,
    Project.listNodes
  )
);

const getOutputCount = def(
  'getOutputCount :: Project -> Number',
  R.compose(
    R.reduce(R.max, 0),
    R.map(R.compose(R.length, Project.listOutputPins)),
    Project.listPatches
  )
);

const kebabToSnake = R.replace(/-/g, '_');

const createPatchNames = def(
  'createPatchNames :: PatchPath -> { owner :: String, libName :: String, patchName :: String }',
  (path) => {
    // TODO: this handles @/local-patches incorrectly
    const [owner, libName, ...patchNameParts] = R.split('/', path);
    const patchName = patchNameParts.join('/');

    return R.map(kebabToSnake, {
      owner,
      libName,
      patchName,
    });
  }
);

const findPatchByPath = def(
  'findPatchByPath :: PatchPath -> [TPatch] -> TPatch',
  (path, patches) => R.compose(
    R.find(R.__, patches),
    R.allPass,
    R.map(R.apply(R.propEq)),
    R.toPairs,
    createPatchNames
  )(path)
);

const getLinksInputNodeIds = def(
  'getLinksInputNodeIds :: [Link] -> [TNodeId]',
  R.compose(
    R.uniq,
    R.map(R.compose(
      toInt,
      Project.getLinkInputNodeId
    ))
  )
);

const getPatchByNodeId = def(
  'getPatchByNodeId :: Project -> PatchPath -> [TPatch] -> NodeId -> TPatch',
  (project, entryPath, patches, nodeId) => R.compose(
    findPatchByPath(R.__, patches),
    Project.getNodeType,
    Project.getNodeByIdUnsafe(nodeId),
    Project.getPatchByPathUnsafe
  )(entryPath, project)
);

const toposortProject = def(
  'toposortProject :: PatchPath -> Project -> Either Error Object',
  (path, project) => R.compose(
    R.chain(nodeIdsMap => R.compose(
      R.map(R.applySpec({
        project: R.identity,
        nodeIdsMap: R.always(nodeIdsMap),
      })),
      () => Project.updatePatch(path, Project.applyNodeIdMap(R.__, nodeIdsMap), project)
    )(nodeIdsMap)),
    Project.getTopologyMap,
    Project.getPatchByPathUnsafe
  )(path, project)
);

//-----------------------------------------------------------------------------
//
// Transformers
//
//-----------------------------------------------------------------------------


// Creates a TConfig object from entry-point path and project
const createTConfig = def(
  'createTConfig :: TranspilationOptions -> PatchPath -> Number -> Project -> TConfig',
  (opts, path, deferNodeCount, project) => R.applySpec({
    NODE_COUNT: R.compose(getNodeCount, Project.getPatchByPathUnsafe(path)),
    MAX_OUTPUT_COUNT: getOutputCount,
    XOD_DEBUG: () => (opts.debug),
    DEFER_NODE_COUNT: R.always(deferNodeCount),
  })(project)
);

const createTPatches = def(
  'createTPatches :: PatchPath -> Project -> [TPatch]',
  (entryPath, project) => R.compose(
    R.values,
    R.mapObjIndexed((patch, path) => {
      const names = createPatchNames(path);
      const impl = explodeMaybe(
        `Implementation for ${path} not found`,
        Project.getImplByArray(ARDUINO_IMPLS, patch)
      );

      const outputs = R.compose(
        R.map(R.applySpec({
          type: Project.getPinType,
          pinKey: Project.getPinLabel,
          value: R.compose(
            Project.defaultValueOfType,
            Project.getPinType
          ),
        })),
        Project.normalizePinLabels,
        Project.listOutputPins
      )(patch);
      const inputs = R.compose(
        R.map(R.applySpec({
          type: Project.getPinType,
          pinKey: Project.getPinLabel,
        })),
        Project.normalizePinLabels,
        Project.listInputPins
      )(patch);

      return R.merge(names,
        {
          outputs,
          inputs,
          impl,
        }
      );
    }),
    R.omit([entryPath]),
    R.indexBy(Project.getPatchPath),
    Project.listPatchesWithoutBuiltIns
  )(project)
);

const getPinLabelsMap = def(
  'getPinLabelsMap :: [Pin] -> Map PinKey PinLabel',
  R.compose(
    R.map(Project.getPinLabel),
    R.indexBy(Project.getPinKey)
  )
);

const getNodePinsUnsafe = def(
  'getNodePinsUnsafe :: Node -> Project -> [Pin]',
  (node, project) => R.compose(
    explodeMaybe(`Can’t get node pins of node ${node}. Referred type missing?`),
    Project.getNodePins
  )(node, project)
);

const getNodePinLabels = def(
  'getNodePinLabels :: Node -> Project -> Map PinKey PinLabel',
  R.compose(
    getPinLabelsMap,
    Project.normalizePinLabels,
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
  (pinKey, node, project) => R.compose(
    explodeMaybe(`Can’t find pin with key ${pinKey} for node ${node}"`),
    R.map(R.compose(
      Project.defaultValueOfType,
      Project.getPinType
    )),
    R.chain(Project.getPinByKey(pinKey)),
    Project.getPatchByNode(R.__, project)
  )(node)
);

const getTNodeOutputs = def(
  'getTNodeOutputs :: Project -> PatchPath -> Node -> [TNodeOutput]',
  (project, entryPath, node) => {
    const nodeId = Project.getNodeId(node);
    const nodePins = getNodePinLabels(node, project);

    return R.compose(
      R.values,
      R.mapObjIndexed((links, pinKey) => ({
        to: getLinksInputNodeIds(links),
        pinKey: nodePins[pinKey],
        value: Project.getBoundValue(pinKey, node)
          .getOrElse(getDefaultPinValue(pinKey, node, project)),
      })),
      R.groupBy(Project.getLinkOutputPinKey),
      R.filter(Project.isLinkOutputNodeIdEquals(nodeId)),
      Project.listLinksByNode(node),
      Project.getPatchByPathUnsafe
    )(entryPath, project);
  }
);

const getOutputPinLabelByLink = def(
  'getOutputPinLabelByLink :: Project -> Patch -> Link -> PinLabel',
  (project, patch, link) => {
    const pinKey = Project.getLinkOutputPinKey(link);
    return R.compose(
      explodeMaybe(`Can’t find pin with key ${pinKey} for link ${link} on patch ${patch}`),
      R.map(R.compose(
        Project.getPinLabel,
        R.head,
        Project.normalizePinLabels,
        R.of
      )),
      R.chain(Project.getPinByKey(pinKey)),
      R.chain(Project.getPatchByNode(R.__, project)),
      Project.getNodeById(R.__, patch),
      Project.getLinkOutputNodeId
    )(link);
  }
);

const getTNodeInputs = def(
  'getTNodeInputs :: Project -> PatchPath -> [TPatch] -> Node -> [TNodeInput]',
  (project, entryPath, patches, node) => {
    const patch = Project.getPatchByPathUnsafe(entryPath, project);
    const nodeId = Project.getNodeId(node);
    const nodePins = getNodePinLabels(node, project);

    return R.compose(
      R.map(R.applySpec({
        nodeId: R.compose(toInt, Project.getLinkOutputNodeId),
        patch: R.compose(
          getPatchByNodeId(project, entryPath, patches),
          Project.getLinkOutputNodeId
        ),
        pinKey: R.compose(R.prop(R.__, nodePins), Project.getLinkInputPinKey),
        fromPinKey: getOutputPinLabelByLink(project, patch),
      })),
      R.filter(Project.isLinkInputNodeIdEquals(nodeId)),
      Project.listLinksByNode(node)
    )(patch);
  }
);

// returns an 8-bit number where the first bit is always set to 1,
// and the rest are set to 0 if the corresponding pin has a pulse type:
//
// +---+---+---+---+---+---+---+---+
// | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
// +---+---+---+---+---+---+---+---+
//             <-*---*---*---*
//                etc  Pin1 Pin0
export const getInitialDirtyFlags = def(
  'getInitialDirtyFlags :: [Pin] -> Number',
  R.reduce(
    (flags, pin) => {
      if (Project.getPinType(pin) !== Project.PIN_TYPE.PULSE) {
        return flags;
      }
      const mask = 0b10 << pin.order; // eslint-disable-line no-bitwise
      return flags ^ mask; // eslint-disable-line no-bitwise
    },
    0b11111111
  )
);

const getNodeDirtyFlags = def(
  'getNodeDirtyFlags :: Project -> Node -> Number',
  R.compose(
    getInitialDirtyFlags,
    R.filter(Project.isOutputPin),
    R.flip(getNodePinsUnsafe)
  )
);

const createTNodes = def(
  'createTNodes :: PatchPath -> [TPatch] -> Map NodeId String -> Project -> [TNode]',
  (entryPath, patches, nodeIdsMap, project) => R.compose(
    R.sortBy(
      R.compose(toInt, R.prop('id'))
    ),
    R.map(R.applySpec({
      id: R.compose(toInt, Project.getNodeId),
      originalId: R.compose(reverseLookup(R.__, nodeIdsMap), Project.getNodeId),
      patch: R.compose(findPatchByPath(R.__, patches), Project.getNodeType),
      outputs: getTNodeOutputs(project, entryPath),
      inputs: getTNodeInputs(project, entryPath, patches),
      dirtyFlags: getNodeDirtyFlags(project),
    })),
    Project.listNodes,
    Project.getPatchByPathUnsafe
  )(entryPath, project)
);

const getDeferNodeCount = def(
  'getDeferNodeCount :: PatchPath -> Project -> Number',
  (entryPath, project) => R.compose(
    R.length,
    R.filter(R.compose(Project.isDeferNodeType, Project.getNodeType)),
    Project.listNodes,
    Project.getPatchByPathUnsafe
  )(entryPath, project)
);

/**
 * Transforms Project into TProject.
 * TProject is an object, that ready to be passed into renderer (handlebars)
 * and it has a ready-to-use values, nothing needed to compute anymore.
 */
const transformProjectWithImpls = def(
  'transformProjectWithImpls :: [Source] -> Project -> PatchPath -> TranspilationOptions -> Either Error TProject',
  (impls, project, path, opts) => R.compose(
    Project.wrapDeadRefErrorMessage(path),
    R.chain((tProject) => {
      const nodeWithTooManyOutputs = R.find(
        R.pipe(R.prop('outputs'), R.length, R.lt(7)),
        tProject.patches
      );

      if (nodeWithTooManyOutputs) {
        const { owner, libName, patchName } = nodeWithTooManyOutputs;
        return Either.Left(new Error(`Native node ${owner}/${libName}/${patchName} has more than 7 outputs`));
      }

      return Either.of(tProject);
    }),
    R.map(({ project: proj, nodeIdsMap }) => {
      const patches = createTPatches(path, proj);
      const deferNodeCount = getDeferNodeCount(path, proj);

      return R.applySpec({
        config: createTConfig(opts, path, deferNodeCount),
        patches: R.always(patches),
        nodes: createTNodes(path, patches, nodeIdsMap),
      })(proj);
    }),
    R.chain(R.compose(
      toposortProject(path),
      Project.extractBoundInputsToConstNodes(R.__, path, project),
    )),
    R.chain(Project.flatten(R.__, path, impls)),
    R.unless(
      () => opts.debug,
      R.chain(Project.updatePatch(path, Project.removeDebugNodes))
    ),
    Project.validateProject
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
    transformProjectWithImpls(ARDUINO_IMPLS, project, patchPath, DEFAULT_TRANSPILATION_OPTIONS)
);

export const transformProjectWithDebug = def(
  'transformProjectWithDebug :: Project -> PatchPath -> Either Error TProject',
  (project, patchPath) => {
    const options = R.merge(DEFAULT_TRANSPILATION_OPTIONS, {
      debug: true,
    });
    return transformProjectWithImpls(ARDUINO_IMPLS, project, patchPath, options);
  }
);

export const transpile = renderProject;
