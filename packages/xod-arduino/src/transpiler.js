import R from 'ramda';
import { Either } from 'ramda-fantasy';

import Project from 'xod-project';
import { def } from './types';

import { renderProject } from './templates';

const ARDUINO_IMPLS = ['cpp', 'arduino'];
const CONST_NODETYPES = {
  String: 'xod/core/constant_string',
  Number: 'xod/core/constant_number',
  Boolean: 'xod/core/consttant_logic',
};
const CONST_PATCHES = {
  [CONST_NODETYPES.String]: {
    nodes: {},
    links: {},
    pins: {
      VAL: {
        key: 'VAL',
        direction: 'output',
        label: 'value',
        type: 'string',
        value: '',
        order: 0,
        description: 'Constant value',
      },
    },
    impls: {
      cpp: '// what to do with constant strings?',
    },
  },
  [CONST_NODETYPES.Number]: {
    nodes: {},
    links: {},
    pins: {
      VAL: {
        key: 'VAL',
        direction: 'output',
        label: 'value',
        type: 'number',
        value: 0,
        order: 0,
        description: 'Constant value',
      },
    },
    impls: {
      cpp: '\nstruct State {\n};\n\n{{ GENERATED_CODE }}\n\nvoid evaluate(NodeId nid, State* state) {\n    reemitNumber(nid, Outputs::VAL);\n}\n',
    },
  },
  [CONST_NODETYPES.Boolean]: {
    nodes: {},
    links: {},
    pins: {
      VAL: {
        key: 'VAL',
        direction: 'output',
        label: 'value',
        type: 'boolean',
        value: false,
        order: 0,
        description: 'Constant value',
      },
    },
    impls: {
      cpp: '\nstruct State {\n};\n\n{{ GENERATED_CODE }}\n\nvoid evaluate(NodeId nid, State* state) {\n    reemitLogic(nid, Outputs::VAL);\n}\n',
    },
  },
};
const TYPES_MAP = {
  number: 'Number',
  pulse: 'Logic',
  boolean: 'Logic',
};

// It copies patches of needed const*TYPE* into flatten project,
// Replaces curried pins with new nodes with curried value (inValue)
// And create a links from it
// And returns an unpdated flattened project
const placeConstNodesAndLinks = def(
  'placeConstNodesAndLinks :: Project -> String -> Project',
  (flatProject, path) => {
    const entryPointPatch = Project.getPatchByPath(path, flatProject);
    // 1. Get all curried nodes of entry-point patch
    const curriedPinsOfNodes = R.compose(
      R.reject(R.isEmpty),
      R.mapObjIndexed(R.compose(
        R.unnest,
        R.toPairs,
        Project.getCurriedPins
      )),
      R.indexBy(Project.getNodeId),
      R.chain(Project.listNodes)
    )(entryPointPatch);
    // 2. Get all node types that needed to produce constants
    const constNodeTypes = R.map(
      R.compose(
        R.prop(R.__, CONST_NODETYPES),
        R.type,
        R.last
      ),
      curriedPinsOfNodes
    );
    const constPaths = R.compose(
      R.uniq,
      R.values
    )(constNodeTypes);
    const appendNodeTypes = R.map(R.append, constNodeTypes);
    const curriedNodesData = R.evolve(appendNodeTypes, curriedPinsOfNodes);
    // 3. Get patches for constant nodes
    const constPatches = R.map(R.prop(R.__, CONST_PATCHES), constPaths);
    // 4. Make a list of tuples of const paths and const patches
    const constPatchPairs = R.zip(constPaths, constPatches);
    // 5. Add these patches into flattenProject
    const flattenProjectWithConstPatches = R.reduce(
      (eitherProject, pair) => eitherProject.chain(Project.assocPatch(pair[0], pair[1])),
      Either.of(flatProject),
      constPatchPairs
    );
    // 6. Add new nodes into entry-point patch with desired values and correct types
    // 6.1. Create new nodes
    const newConstNodes = R.map(
      (data) => {
        const type = data[2];
        const value = data[1];

        return R.compose(
          Project.setPinCurriedValue('VAL', value),
          Project.curryPin('VAL', true),
          Project.createNode({ x: 0, y: 0 })
        )(type);
      },
      curriedNodesData
    );
    const appendNodeIds = R.map(R.compose(R.append, Project.getNodeId), newConstNodes);
    const curriedNodesDataWithNewIds = R.evolve(appendNodeIds, curriedNodesData);
    // 6.2. Uncurry pins
    const uncurriedNodes = R.mapObjIndexed(
      (data, key) => R.compose(
        R.chain(Project.curryPin(data[0], false)),
        R.chain(Project.getNodeById(key))
      )(entryPointPatch),
      curriedNodesData
    );
    const patchWithUncurriedNodes = R.reduce(
      R.flip(Project.assocNode),
      R.unnest(entryPointPatch),
      R.values(uncurriedNodes)
    );
    // 6.3. Create new links
    const newLinks = R.mapObjIndexed(
      (data, nodeId) => {
        const pinKey = data[0];
        const newNodeId = data[3];
        return Project.createLink(pinKey, nodeId, 'VAL', newNodeId);
      },
      curriedNodesDataWithNewIds
    );
    // 6.4. Add new nodes (newConstNodes) and links (newLinks) into patch (patchWithUncurriedNodes)
    const patchWithNodes = R.reduce(
      R.flip(Project.assocNode),
      patchWithUncurriedNodes,
      R.values(newConstNodes)
    );
    const patchWithLinks = R.reduce(
      (patch, link) => patch.chain(Project.assocLink(link)),
      Either.of(patchWithNodes),
      R.values(newLinks)
    );
    // 6.5. Assoc updated patch
    const updatedFlattenProject = R.chain(
      Project.assocPatch(path, R.unnest(patchWithLinks)),
      flattenProjectWithConstPatches
    );
    // PROFIT!
    return R.unnest(updatedFlattenProject);
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
  'createTConfig :: Project -> String -> TConfig',
  (project, path) => {
    const nodeCount = Project.getPatchByPath(path, project).chain(getNodeCount);
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
  'createPatchNames :: String -> { owner :: String, libName :: String, patchName :: String }',
  (path) => {
    const sPath = R.split('/', path);
    const owner = sPath.shift();
    const libName = sPath.shift();
    const patchName = sPath.join('/').replace(/-/g, '_');

    return {
      owner,
      libName,
      patchName,
    };
  }
);

const isConstPath = def(
  'isConstPath :: String -> Boolean',
  path => R.contains(path, R.values(CONST_NODETYPES))
);

const createTPatches = def(
  'createTPatches :: Project -> String -> [TPatch]',
  (project, entryPath) => R.compose(
    R.values,
    R.mapObjIndexed((patch, path) => {
      const names = createPatchNames(path);
      const impl = R.unnest(Project.getImplByArray(ARDUINO_IMPLS, patch));
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
  'findPatchByPath :: String -> [TPatch] -> TPatch',
  (path, patches) => R.compose(
    R.find(R.__, patches),
    R.allPass,
    R.map(R.apply(R.propEq)),
    R.toPairs,
    createPatchNames
  )(path)
);

const getTNodeOutputs = def(
  'getTNodeOutputs :: Project -> String -> Node -> [TNodeOutput]',
  (project, entryPath, node) => {
    const nodeId = Project.getNodeId(node);

    return R.compose(
      R.values,
      R.mapObjIndexed((links, pinKey) => {
        const to = R.uniq(R.map(Project.getLinkInputNodeId, links));
        const value = (Project.isPinCurried(pinKey, node)) ?
          R.unnest(Project.getPinCurriedValue(pinKey, node)) :
          null;

        return {
          to,
          pinKey,
          value,
        };
      }),
      R.groupBy(Project.getLinkOutputPinKey),
      R.filter(Project.isLinkOutputNodeIdEquals(nodeId)),
      R.chain(Project.listLinksByNode(node)),
      Project.getPatchByPath
    )(entryPath, project);
  }
);

const getPatchByNodeId = def(
  'getPatchByNodeId :: Project -> String -> [TPatch] -> String -> TPatch',
  (project, entryPath, patches, nodeId) => R.compose(
    findPatchByPath(R.__, patches),
    R.chain(Project.getNodeType),
    R.chain(Project.getNodeById(nodeId)),
    Project.getPatchByPath
  )(entryPath, project)
);

const getTNodeInputs = def(
  'getTNodeInputs :: Project -> String -> [TPatch] -> Node -> [TNodeInput]',
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
      R.chain(Project.listLinksByNode(node)),
      Project.getPatchByPath
    )(entryPath, project);
  }
);

const createTNodes = def(
  'createTNodes :: Project -> String -> [TPatch] -> [TNode]',
  (project, entryPath, patches) => R.compose(
    R.map(R.applySpec({
      id: Project.getNodeId,
      patch: R.compose(findPatchByPath(R.__, patches), Project.getNodeType),
      outputs: getTNodeOutputs(project, entryPath),
      inputs: getTNodeInputs(project, entryPath, patches),
    })),
    R.chain(Project.listNodes),
    Project.getPatchByPath
  )(entryPath, project)
);

const renumberProject = def(
  'renumberProject :: String -> Project -> Project',
  (path, project) => R.compose(
    R.unnest,
    Project.assocPatch(path, R.__, project),
    R.chain(Project.renumberNodes),
    Project.getPatchByPath
  )(path, project)
);

// Transforms Project into TProject
export const transformProject = def(
  'transformProject :: Project -> String -> [Source] -> TProject',
  (project, path, impls) => {
    const flattenProject = R.compose(
      renumberProject(path),
      // sort using topology before renumber!
      R.chain(placeConstNodesAndLinks(R.__, path)),
      Project.flatten
    )(project, path, impls);

    const topology = R.compose(
      R.map(num => parseInt(num, 10)),
      R.chain(Project.getTopology),
      Project.getPatchByPath
    )(path, flattenProject);

    const config = createTConfig(flattenProject, path);
    const patches = createTPatches(flattenProject, path);
    const nodes = createTNodes(flattenProject, path, patches);

    return {
      config,
      patches,
      nodes,
      topology,
    };
  }
);

export default def(
  'transpile :: Project -> String -> String',
  (project, path) => {
    const projectContext = transformProject(project, path, ARDUINO_IMPLS);
    return renderProject(projectContext);
  }
);
