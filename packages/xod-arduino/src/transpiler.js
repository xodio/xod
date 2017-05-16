import R from 'ramda';

import { explode } from 'xod-func-tools';
import * as Project from 'xod-project';
import { def } from './types';

import { renderProject } from './templates';

const ARDUINO_IMPLS = ['cpp', 'arduino'];
const CONSTANT_VALUE_PINKEY = 'VAL'; // pinKey of output pin of constant patch, that curried and linked
const CONST_NODETYPES = {
  string: 'xod/core/constant-string',
  number: 'xod/core/constant-number',
  boolean: 'xod/core/constant-logic',
  pulse: 'xod/core/constant-logic',
};
const TYPES_MAP = {
  number: 'Number',
  pulse: 'Logic',
  boolean: 'Logic',
};

//-----------------------------------------------------------------------------
//
// Utils
//
//-----------------------------------------------------------------------------

// :: x -> Number
const toInt = R.flip(parseInt)(10);

const isNodeWithCurriedPins = def(
  'isNodeWithCurriedPins :: Node -> Boolean',
  R.compose(
    R.complement(R.isEmpty),
    Project.getCurriedPins
  )
);

const nestedValues = def(
  'nestedValues :: Map String (Map String a) -> [a]',
  R.compose(
    R.unnest,
    R.map(R.values),
    R.values
  )
);

const isCurriedInNodePin = def(
  'isCurriedInNodePin :: Map NodeId (Map PinKey DataValue) -> NodeId -> Pin -> Boolean',
  (nodePinValues, nodeId, pin) => {
    const pinKey = Project.getPinKey(pin);
    const nodePins = R.prop(nodeId, nodePinValues);
    return R.has(pinKey, nodePins);
  }
);

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

const isConstPath = def(
  'isConstPath :: PatchPath -> Boolean',
  path => R.contains(path, R.values(CONST_NODETYPES))
);

const createPatchNames = def(
  'createPatchNames :: PatchPath -> { owner :: String, libName :: String, patchName :: String }',
  (path) => {
    const [owner, libName, ...patchNameParts] = R.split('/', path);
    const patchName = patchNameParts.join('/').replace(/-/g, '_');

    return {
      owner,
      libName,
      patchName,
    };
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

const renumberProject = def(
  'renumberProject :: PatchPath -> Project -> Project',
  (path, project) => R.compose(
    explode,
    Project.assocPatch(path, R.__, project),
    Project.renumberNodes,
    Project.getPatchByPathUnsafe
  )(path, project)
);

const getMapOfNodePinValues = def(
  'getMapOfNodePinValues :: [Node] -> Map NodeId (Map PinKey DataValue)',
  R.compose(
    R.reject(R.isEmpty),
    R.map(Project.getCurriedPins),
    R.indexBy(Project.getNodeId)
  )
);

const getMapOfNodeTypes = def(
  'getMapOfNodeTypes :: [Node] -> Map NodeId PatchPath',
  R.compose(
    R.map(Project.getNodeType),
    R.indexBy(Project.getNodeId)
  )
);

const getMapOfNodePinTypes = def(
  'getMapOfNodePinTypes :: Map NodeId (Map PinKey DataValue) -> [Node] -> Project -> Map NodeId (Map PinKey DataType)',
  (mapOfNodePinValues, curriedNodes, project) => R.mapObjIndexed(
    (patchPath, nodeId) => R.compose(
      R.map(Project.getPinType),
      R.indexBy(Project.getPinKey),
      R.filter(isCurriedInNodePin(mapOfNodePinValues, nodeId)),
      Project.listPins,
      Project.getPatchByPathUnsafe(R.__, project)
    )(patchPath),
    getMapOfNodeTypes(curriedNodes)
  )
);

// :: { NodeId: { PinKey: PinType } } -> { NodeId: { PinKey: PatchPath } }
const convertMapOfPinTypesIntoMapOfPinPaths = def(
  'convertMapOfPinTypesIntoMapOfPinPaths :: Map NodeId (Map PinKey DataType) -> Map NodeId (Map PinKey PatchPath)',
  R.map(R.map(R.prop(R.__, CONST_NODETYPES)))
);

const getMapOfPinPaths = def(
  'getMapOfPinPaths :: Map NodeId (Map PinKey DataValue) -> [Node] -> Project -> Map NodeId (Map PinKey PatchPath)',
  R.compose(
    convertMapOfPinTypesIntoMapOfPinPaths,
    getMapOfNodePinTypes
  )
);

const getPathsFromMapOfPinPaths = def(
  'getPathsFromMapOfPinPaths :: Map NodeId (Map PinKey PatchPath) -> [PatchPath]',
  R.compose(
    R.uniq,
    nestedValues
  )
);

const getPatchesFromProject = def(
  'getPatchesFromProject :: [PatchPath] -> Project -> [Patch]',
  (paths, project) => R.map(
    path => Project.getPatchByPathUnsafe(path, project),
    paths
  )
);

const assocPatchesToProject = def(
  'assocPatchesToProject :: [Pair PatchPath Patch] -> Project -> Project',
  (patchPairs, project) => R.reduce(
    (proj, pair) => explode(Project.assocPatch(pair[0], pair[1], proj)),
    project,
    patchPairs
  )
);

const createNodesWithCurriedPins = def(
  'createNodesWithCurriedPins :: Map NodeId (Map PinKey DataValue) -> Map NodeId (Map PinKey PatchPath) -> Map NodeId (Map PinKey Node)',
  (mapOfPinValues, mapOfPinPaths) => R.mapObjIndexed(
    (pinsData, nodeId) => R.mapObjIndexed(
      (pinValue, pinKey) => {
        const type = R.path([nodeId, pinKey], mapOfPinPaths);

        return R.compose(
          Project.setPinCurriedValue(CONSTANT_VALUE_PINKEY, pinValue),
          Project.curryPin(CONSTANT_VALUE_PINKEY, true),
          Project.createNode({ x: 0, y: 0 })
        )(type);
      },
      pinsData
    ),
    mapOfPinValues
  )
);

const uncurryPins = def(
  'uncurryPins :: Map NodeId (Map PinKey DataValue) -> Patch -> Map NodeId Node',
  (mapOfPinValues, patch) => R.mapObjIndexed(
    (pinData, nodeId) => {
      const pinKeys = R.keys(pinData);
      return R.compose(
        R.reduce(
          (node, pinKey) => Project.curryPin(pinKey, false, node),
          R.__,
          pinKeys
        ),
        Project.getNodeByIdUnsafe(nodeId)
      )(patch);
    },
    mapOfPinValues
  )
);

const assocUncurriedNodesToPatch = def(
  'assocUncurriedNodesToPatch :: Map NodeId Node -> Patch -> Patch',
  (nodesMap, patch) => R.reduce(
    R.flip(Project.assocNode),
    patch,
    R.values(nodesMap)
  )
);

// :: { NodeId: { PinKey: Node } } -> { NodeId: { PinKey: Link } }
const createLinksFromCurriedPins = def(
  'createLinksFromCurriedPins :: Map NodeId (Map PinKey Node) -> Map NodeId (Map PinKey Link)',
  R.mapObjIndexed(
    (pinsData, nodeId) => R.mapObjIndexed(
      (node, pinKey) => {
        const newNodeId = Project.getNodeId(node);
        return Project.createLink(pinKey, nodeId, CONSTANT_VALUE_PINKEY, newNodeId);
      },
      pinsData
    )
  )
);

const assocNodesToPatch = def(
  'assocNodesToPatch :: Map NodeId (Map PinKey Node) -> Patch -> Patch',
  (nodesMap, patch) => R.reduce(
    R.flip(Project.assocNode),
    patch,
    nestedValues(nodesMap)
  )
);

const assocLinksToPatch = def(
  'assocLinksToPatch :: Map NodeId (Map PinKey Link) -> Patch -> Patch',
  (linksMap, patch) => R.reduce(
    (p, link) => explode(Project.assocLink(link, p)),
    patch,
    nestedValues(linksMap)
  )
);

const uncurryAndAssocNodes = def(
  'uncurryAndAssocNodes :: Map NodeId (Map PinKey DataValue) -> Patch -> Patch',
  (mapOfNodePinValues, patch) => R.compose(
    assocUncurriedNodesToPatch(R.__, patch),
    uncurryPins(mapOfNodePinValues)
  )(patch)
);

const getTuplesOfPatches = def(
  'getTuplesOfPatches :: Map NodeId (Map PinKey PatchPath) -> Project -> [Pair PatchPath Patch]',
  (mapOfPinPaths, project) => R.compose(
    R.converge(
      R.zip,
      [
        R.identity,
        getPatchesFromProject(R.__, project),
      ]
    ),
    getPathsFromMapOfPinPaths
  )(mapOfPinPaths)
);

// :: { NodeId: { PinKey: PatchPath } } -> Project -> Project -> Project
const copyConstPatches = def(
  'copyConstPatches :: Map NodeId (Map PinKey PatchPath) -> Project -> Project -> Project',
  (mapOfPinPaths, sourceProject, targetProject) => R.compose(
    assocPatchesToProject(R.__, targetProject),
    getTuplesOfPatches
  )(mapOfPinPaths, sourceProject)
);

const updatePatch = def(
  'updatePatch :: Map NodeId (Map PinKey Link) -> Map NodeId (Map PinKey Node) -> Map NodeId (Map PinKey DataValue) -> Patch -> Patch',
  (mapOfLinks, mapOfNodes, mapOfPinValues, patch) => R.compose(
    assocLinksToPatch(mapOfLinks),
    assocNodesToPatch(mapOfNodes),
    uncurryAndAssocNodes(mapOfPinValues)
  )(patch)
);

//-----------------------------------------------------------------------------
//
// Transformers
//
//-----------------------------------------------------------------------------

// It copies patches of needed const*TYPE* into flat project,
// Replaces curried pins with new nodes with curried value (inValue)
// And creates links from them
// And returns updated flat project
const placeConstNodesAndLinks = def(
  'placeConstNodesAndLinks :: Project -> PatchPath -> Project -> Project',
  (flatProject, path, origProject) => {
    const entryPointPatch = Project.getPatchByPathUnsafe(path, flatProject);
    const entryPointNodes = Project.listNodes(entryPointPatch);
    const nodesWithCurriedPins = R.filter(isNodeWithCurriedPins, entryPointNodes);

    const nodePinValues = getMapOfNodePinValues(entryPointNodes);
    const pinPaths = getMapOfPinPaths(nodePinValues, nodesWithCurriedPins, flatProject);

    const newConstNodes = createNodesWithCurriedPins(nodePinValues, pinPaths);
    const newLinks = createLinksFromCurriedPins(newConstNodes);
    const newPatch = updatePatch(newLinks, newConstNodes, nodePinValues, entryPointPatch);

    return R.compose(
      explode,
      Project.assocPatch(path, newPatch),
      copyConstPatches(pinPaths, origProject)
    )(flatProject);
  }
);

// Creates a TConfig object from entry-point path and project
const createTConfig = def(
  'createTConfig :: PatchPath -> Project -> TConfig',
  (path, project) => R.applySpec({
    NODE_COUNT: R.compose(getNodeCount, Project.getPatchByPathUnsafe(path)),
    MAX_OUTPUT_COUNT: getOutputCount,
    XOD_DEBUG: R.F,
  })(project)
);

const createTTopology = def(
  'createTTopology :: PatchPath -> Project -> [Number]',
  R.compose(
    R.map(toInt),
    Project.getTopology,
    Project.getPatchByPathUnsafe
  )
);

const createTPatches = def(
  'createTPatches :: PatchPath -> Project -> [TPatch]',
  (entryPath, project) => R.compose(
    R.values,
    R.mapObjIndexed((patch, path) => {
      const names = createPatchNames(path);
      const impl = explode(Project.getImplByArray(ARDUINO_IMPLS, patch));
      const isDirty = isConstPath(path);

      const outputs = R.compose(
        R.map(R.applySpec({
          type: R.compose(R.prop(R.__, TYPES_MAP), Project.getPinType),
          pinKey: Project.getPinKey,
          value: R.compose(Project.defaultValueOfType, Project.getPinType),
        })),
        Project.listOutputPins
      )(patch);
      const inputs = R.compose(
        R.map(R.applySpec({ pinKey: Project.getPinKey })),
        Project.listInputPins
      )(patch);

      return R.merge(names,
        {
          outputs,
          inputs,
          impl,
          isDirty,
        }
      );
    }),
    R.omit([entryPath]),
    R.indexBy(Project.getPatchPath),
    Project.listPatchesWithoutBuiltIns
  )(project)
);

const getTNodeOutputs = def(
  'getTNodeOutputs :: Project -> PatchPath -> Node -> [TNodeOutput]',
  (project, entryPath, node) => {
    const nodeId = Project.getNodeId(node);

    return R.compose(
      R.values,
      R.mapObjIndexed((links, pinKey) => {
        const to = getLinksInputNodeIds(links);
        const value = (Project.isPinCurried(pinKey, node)) ?
          explode(Project.getPinCurriedValue(pinKey, node)) :
          null;

        return {
          to,
          pinKey,
          value,
        };
      }),
      R.groupBy(Project.getLinkOutputPinKey),
      R.filter(Project.isLinkOutputNodeIdEquals(nodeId)),
      Project.listLinksByNode(node),
      Project.getPatchByPathUnsafe
    )(entryPath, project);
  }
);

const getTNodeInputs = def(
  'getTNodeInputs :: Project -> PatchPath -> [TPatch] -> Node -> [TNodeInput]',
  (project, entryPath, patches, node) => {
    const nodeId = Project.getNodeId(node);

    return R.compose(
      R.map(R.applySpec({
        nodeId: R.compose(toInt, Project.getLinkOutputNodeId),
        patch: R.compose(
          getPatchByNodeId(project, entryPath, patches),
          Project.getLinkOutputNodeId
        ),
        pinKey: Project.getLinkInputPinKey,
        fromPinKey: Project.getLinkOutputPinKey,
      })),
      R.filter(Project.isLinkInputNodeIdEquals(nodeId)),
      Project.listLinksByNode(node),
      Project.getPatchByPathUnsafe
    )(entryPath, project);
  }
);

const createTNodes = def(
  'createTNodes :: PatchPath -> [TPatch] -> Project -> [TNode]',
  (entryPath, patches, project) => R.compose(
    R.map(R.applySpec({
      id: R.compose(toInt, Project.getNodeId),
      patch: R.compose(findPatchByPath(R.__, patches), Project.getNodeType),
      outputs: getTNodeOutputs(project, entryPath),
      inputs: getTNodeInputs(project, entryPath, patches),
    })),
    Project.listNodes,
    Project.getPatchByPathUnsafe
  )(entryPath, project)
);

// Transforms Project into TProject
export const transformProject = def(
  'transformProject :: [Source] -> Project -> PatchPath -> Either Error TProject',
  (impls, project, path) => R.compose(
    R.map(R.compose(
      (proj) => {
        const patches = createTPatches(path, proj);
        return R.applySpec({
          config: createTConfig(path),
          patches: R.always(patches),
          nodes: createTNodes(path, patches),
          topology: createTTopology(path),
        })(proj);
      },
      renumberProject(path),
      placeConstNodesAndLinks(R.__, path, project)
    )),
    Project.flatten
  )(project, path, impls)
);

export default def(
  'transpile :: Project -> PatchPath -> Either Error String',
  R.compose(R.map(renderProject), transformProject(ARDUINO_IMPLS))
);
