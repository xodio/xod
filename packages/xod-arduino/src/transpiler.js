import R from 'ramda';

import { explode, explodeMaybe } from 'xod-func-tools';
import Project from 'xod-project';
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

// :: Node -> Boolean
const isNodeWithCurriedPins = R.compose(
  R.complement(R.isEmpty),
  Project.getCurriedPins
);

// :: { a: { b: c } } -> [c]
const nestedValues = R.compose(
  R.unnest,
  R.map(R.values),
  R.values
);

// :: { NodeId: { PinKey: DataValue } } -> NodeId -> Pin -> Boolean
const isCurriedInNodePin = R.curry((nodePinValues, nodeId, pin) => {
  const pinKey = Project.getPinKey(pin);
  const nodePins = R.prop(nodeId, nodePinValues);
  return R.has(pinKey, nodePins);
});

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

    // 1. Get all curried nodes of entry-point patch
    // :: Patch -> { NodeId: { PinKey: DataValue } }
    const nodePinValues = R.compose(
      R.reject(R.isEmpty),
      R.map(Project.getCurriedPins),
      R.indexBy(Project.getNodeId)
    )(entryPointNodes);
    // 2. Get all node types that needed to produce constant nodes
    // :: [Node] -> { NodeId: PatchPath }
    const constNodeTypes = R.compose(
      R.map(Project.getNodeType),
      R.indexBy(Project.getNodeId)
    )(nodesWithCurriedPins);
    // 3. Get all pin types of nodes with curried pins
    // :: { NodeId: PatchPath } -> { NodeId: { PinKey: PinType } }
    // TODO: Add filtering of pins that aren't curried (filter by nodePinValues[nodeId][pinKey])
    const nodePinTypes = R.mapObjIndexed(
      (patchPath, nodeId) => R.compose(
        R.map(Project.getPinType),
        R.indexBy(Project.getPinKey),
        R.filter(isCurriedInNodePin(nodePinValues, nodeId)),
        Project.listPins,
        Project.getPatchByPathUnsafe(R.__, flatProject)
      )(patchPath),
      constNodeTypes
    );
    // 4. Get all pin types of nodes with curried pins
    // :: { NodeId: { PinKey: PinType } } -> { NodeId: { PinKey: PatchPath } }
    const constPinPaths = R.map(R.map(R.prop(R.__, CONST_NODETYPES)), nodePinTypes);
    // 5. Get uniq patch paths to copy patches
    // :: { NodeId: { PinKey: PatchPath }} -> [PatchPath]
    const constPaths = R.compose(
      R.uniq,
      nestedValues
    )(constPinPaths);
    // 6. Get patches for constant nodes from original project
    // :: [PatchPath] -> [Patch]
    const constPatches = R.map(
      constPath => R.compose(
        explodeMaybe(`Could not find the patch '${constPath}' in the project`),
        Project.getPatchByPath(R.__, origProject)
      )(constPath)
    )(constPaths);
    // 7. Make a list of tuples of const paths and const patches
    // :: [PatchPath] -> [Patch] -> { PatchPath: Patch }
    const constPatchPairs = R.zip(constPaths, constPatches);
    // 8. Add these patches into flatProject
    // :: Project -> { PatchPath: Patch } -> Project
    const flatProjectWithConstPatches = R.reduce(
      (proj, pair) => explode(Project.assocPatch(pair[0], pair[1], proj)),
      flatProject,
      constPatchPairs
    );
    // 9. Add new nodes into entry-point patch with desired values and correct types
    // 9.1. Create new nodes
    // :: { NodeId: { PinKey: DataValue } } -> { NodeId: { PinKey: Node } }
    const newConstNodes = R.mapObjIndexed(
      (pinsData, nodeId) => R.mapObjIndexed(
        (pinValue, pinKey) => {
          const type = R.path([nodeId, pinKey], constPinPaths);

          return R.compose(
            Project.setPinCurriedValue(CONSTANT_VALUE_PINKEY, pinValue),
            Project.curryPin(CONSTANT_VALUE_PINKEY, true),
            Project.createNode({ x: 0, y: 0 })
          )(type);
        },
        pinsData
      ),
      nodePinValues
    );
    // 9.2. Uncurry pins
    // :: { NodeId: { PinKey: DataValue } } -> { NodeId: Node }
    const uncurriedNodes = R.mapObjIndexed(
      (pinData, nodeId) => {
        const pinKeys = R.keys(pinData);

        return R.compose(
          R.reduce(
            (node, pinKey) => Project.curryPin(pinKey, false, node),
            R.__,
            pinKeys
          ),
          explode,
          Project.getNodeById(nodeId)
        )(entryPointPatch);
      },
      nodePinValues
    );
    // 9.3. Assoc uncurried nodes into patch
    // :: Patch -> { NodeId: Node } -> Patch
    const patchWithUncurriedNodes = R.reduce(
      R.flip(Project.assocNode),
      entryPointPatch,
      R.values(uncurriedNodes)
    );
    // 9.4. Create new links
    // :: { NodeId: { PinKey: Node } } -> { NodeId: { PinKey: Link } }
    const newLinks = R.mapObjIndexed(
      (pinsData, nodeId) => R.mapObjIndexed(
        (node, pinKey) => {
          const newNodeId = Project.getNodeId(node);

          return Project.createLink(pinKey, nodeId, CONSTANT_VALUE_PINKEY, newNodeId);
        },
        pinsData
      ),
      newConstNodes
    );
    // 9.5. Add new nodes (newConstNodes) and links (newLinks) into patch (patchWithUncurriedNodes)
    // :: Patch -> { NodeId: { PinKey: Node } } -> Patch
    const patchWithNodes = R.reduce(
      R.flip(Project.assocNode),
      patchWithUncurriedNodes,
      nestedValues(newConstNodes)
    );
    // :: Patch -> { NodeId: { PinKey: Link } } -> Patch
    const patchWithLinks = R.reduce(
      (patch, link) => explode(Project.assocLink(link, patch)),
      patchWithNodes,
      nestedValues(newLinks)
    );
    // 9.6. Assoc updated patch
    // :: PatchPath -> Patch -> Project -> Maybe Project
    const updatedFlattenProject = Project.assocPatch(
      path,
      patchWithLinks,
      flatProjectWithConstPatches
    );

    // PROFIT!
    return explode(updatedFlattenProject);
  }
);

const getNodeCount = def(
  'getNodeCount :: Patch -> Number',
  patch => R.compose(
    R.length,
    Project.listNodes
  )(patch)
);

// Creates a TConfig object from project and entry-point path
const createTConfig = def(
  'createTConfig :: PatchPath -> Project -> TConfig',
  (path, project) => {
    const nodeCount = getNodeCount(Project.getPatchByPathUnsafe(path, project));
    const outputCount = R.compose(
      R.reduce(R.max, 0),
      R.map(R.compose(R.length, Project.listOutputPins)),
      Project.listPatches
    )(project);

    return {
      NODE_COUNT: nodeCount,
      MAX_OUTPUT_COUNT: outputCount,
      XOD_DEBUG: false,
    };
  }
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

const createTTopology = def(
  'createTTopology :: PatchPath -> Project -> [Number]',
  R.compose(
    R.map(num => parseInt(num, 10)),
    Project.getTopology,
    Project.getPatchByPathUnsafe
  )
);

const isConstPath = def(
  'isConstPath :: PatchPath -> Boolean',
  path => R.contains(path, R.values(CONST_NODETYPES))
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
    R.converge(R.zipObj, [Project.listPatchPaths, Project.listPatches])
  )(project)
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

const getTNodeOutputs = def(
  'getTNodeOutputs :: Project -> PatchPath -> Node -> [TNodeOutput]',
  (project, entryPath, node) => {
    const nodeId = Project.getNodeId(node);

    return R.compose(
      R.values,
      R.mapObjIndexed((links, pinKey) => {
        const to = R.uniq(R.map(Project.getLinkInputNodeId, links));
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

const getPatchByNodeId = def(
  'getPatchByNodeId :: Project -> PatchPath -> [TPatch] -> NodeId -> TPatch',
  (project, entryPath, patches, nodeId) => R.compose(
    findPatchByPath(R.__, patches),
    Project.getNodeType,
    explode,
    Project.getNodeById(nodeId),
    Project.getPatchByPathUnsafe
  )(entryPath, project)
);

const getTNodeInputs = def(
  'getTNodeInputs :: Project -> PatchPath -> [TPatch] -> Node -> [TNodeInput]',
  (project, entryPath, patches, node) => {
    const nodeId = Project.getNodeId(node);

    return R.compose(
      R.map(R.applySpec({
        nodeId: Project.getLinkOutputNodeId,
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
      id: Project.getNodeId,
      patch: R.compose(findPatchByPath(R.__, patches), Project.getNodeType),
      outputs: getTNodeOutputs(project, entryPath),
      inputs: getTNodeInputs(project, entryPath, patches),
    })),
    Project.listNodes,
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
