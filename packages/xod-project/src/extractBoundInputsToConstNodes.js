import * as R from 'ramda';

import { explodeEither } from 'xod-func-tools';

import * as Pin from './pin';
import * as Node from './node';
import * as Link from './link';
import * as Patch from './patch';
import * as Project from './project';
import { PIN_TYPE, CONST_NODETYPES, PULSE_CONST_NODETYPES } from './constants';
import squashSingleOutputNodes from './optimizers/squashSingleOutputNodes';
import { def } from './types';

const CONST_PATCH_PATHS = R.compose(R.uniq, R.values, R.merge)(
  CONST_NODETYPES,
  PULSE_CONST_NODETYPES
);

const getMapOfNodePinsWithLinks = def(
  'getMapOfNodePinsWithLinks :: [Node] -> [Link] -> Map NodeId [PinKey]',
  (nodes, links) =>
    R.compose(
      R.map(
        R.compose(
          R.map(Link.getLinkInputPinKey),
          R.filter(R.__, links),
          Link.isLinkInputNodeIdEquals,
          Node.getNodeId
        )
      ),
      R.indexBy(Node.getNodeId)
    )(nodes)
);

const getMapOfNodeOutputPins = def(
  'getMapOfNodeOutputPins :: [Node] -> Project -> Map NodeId [PinKey]',
  (nodes, project) =>
    R.compose(
      R.map(
        R.compose(
          R.map(Pin.getPinKey),
          Patch.listOutputPins,
          Project.getPatchByPathUnsafe(R.__, project),
          Node.getNodeType
        )
      ),
      R.indexBy(Node.getNodeId)
    )(nodes)
);

const getNodePinValues = def(
  'getNodePinValues :: Project -> Map NodeId Node -> Map NodeId (Map PinKey DataValue)',
  (project, nodes) =>
    R.map(
      node =>
        R.compose(
          R.merge(Node.getAllBoundValues(node)),
          R.map(Node.getBoundValueOrDefault(R.__, node)),
          R.indexBy(Pin.getPinKey),
          Patch.listPins,
          Project.getPatchByPathUnsafe(R.__, project),
          Node.getNodeType
        )(node),
      nodes
    )
);

const getMapOfNodePinValues = def(
  'getMapOfNodePinValues :: Project -> [Node] -> Map NodeId (Map PinKey DataValue)',
  (project, nodes) =>
    R.compose(
      R.reject(R.isEmpty),
      getNodePinValues(project),
      R.indexBy(Node.getNodeId)
    )(nodes)
);

const getMapOfNodeTypes = def(
  'getMapOfNodeTypes :: [Node] -> Map NodeId PatchPath',
  R.compose(R.map(Node.getNodeType), R.indexBy(Node.getNodeId))
);

const isCurriedInNodePin = def(
  'isCurriedInNodePin :: Map NodeId (Map PinKey DataValue) -> NodeId -> Pin -> Boolean',
  (nodePinValues, nodeId, pin) => {
    const pinKey = Pin.getPinKey(pin);
    const nodePins = R.prop(nodeId, nodePinValues);
    return R.has(pinKey, nodePins);
  }
);

const getMapOfNodePinTypes = def(
  'getMapOfNodePinTypes :: Map NodeId (Map PinKey DataValue) -> [Node] -> Project -> Map NodeId (Map PinKey DataType)',
  (mapOfNodePinValues, curriedNodes, project) =>
    R.mapObjIndexed(
      (patchPath, nodeId) =>
        R.compose(
          R.map(Pin.getPinType),
          R.indexBy(Pin.getPinKey),
          R.filter(isCurriedInNodePin(mapOfNodePinValues, nodeId)),
          Patch.listPins,
          Project.getPatchByPathUnsafe
        )(patchPath, project),
      getMapOfNodeTypes(curriedNodes)
    )
);

const getMapOfExtractablePinPaths = def(
  'getMapOfExtractablePinPaths :: Map NodeId (Map PinKey DataValue) -> [Node] -> Project -> Map NodeId (Map PinKey PatchPath)',
  R.compose(
    R.map(R.reject(R.isNil)),
    R.map(
      R.map(
        ([pinType, pinValue]) =>
          pinType === PIN_TYPE.PULSE
            ? PULSE_CONST_NODETYPES[pinValue]
            : CONST_NODETYPES[pinType]
      )
    ),
    R.converge(R.mergeWith(R.mergeWith(Array.of)), [
      getMapOfNodePinTypes,
      R.identity,
    ])
  )
);

const getMapOfPathsToPinKeys = def(
  'getMapOfPathsToPinKeys :: [PatchPath] -> Project -> Map PatchPath PinKey',
  (constantPaths, project) =>
    R.compose(
      R.fromPairs,
      R.map(constPath =>
        R.compose(
          constPinKey => [constPath, constPinKey],
          Pin.getPinKey,
          R.head,
          Patch.listOutputPins,
          Project.getPatchByPathUnsafe(R.__, project)
        )(constPath)
      )
    )(constantPaths)
);

const createNodesWithBoundValues = def(
  'createNodesWithBoundValues :: Map NodeId (Map PinKey DataValue) -> Map NodeId (Map PinKey PatchPath) -> Map PatchPath PinKey -> Map NodeId (Map PinKey Node)',
  (allInputPinValues, extractablePinPaths, mapOfPinKeys) =>
    R.mapObjIndexed(
      (pinsData, nodeId) =>
        R.compose(
          R.mapObjIndexed((pinValue, pinKey) => {
            const type = R.path([nodeId, pinKey], extractablePinPaths);
            const constPinKey = R.prop(type, mapOfPinKeys);

            return R.compose(
              R.unless(
                R.always(R.equals(PIN_TYPE.PULSE, type)),
                // do not transfer bound values to 'pulse constants'
                Node.setBoundValue(constPinKey, pinValue)
              ),
              Node.createNode({ x: 0, y: 0 })
            )(type);
          }),
          R.pickBy((pinValue, pinKey) =>
            R.path([nodeId, pinKey], extractablePinPaths)
          )
        )(pinsData),
      allInputPinValues
    )
);

const nestedValues = def(
  'nestedValues :: Map String (Map String a) -> [a]',
  R.compose(R.unnest, R.map(R.values), R.values)
);

// :: { NodeId: { PinKey: Node } } -> { NodeId: { PinKey: Link } }
const createLinksFromCurriedPins = def(
  'createLinksFromCurriedPins :: Map NodeId (Map PinKey Node) -> Map PinKey PinLabel -> Map NodeId (Map PinKey Link)',
  (mapOfPinNodes, mapOfPinKeys) =>
    R.mapObjIndexed((pinsData, nodeId) =>
      R.mapObjIndexed((node, pinKey) => {
        const constNodeId = Node.getNodeId(node);
        const constNodeType = Node.getNodeType(node);

        return Link.createLink(
          pinKey,
          nodeId,
          mapOfPinKeys[constNodeType],
          constNodeId
        );
      }, pinsData)
    )(mapOfPinNodes)
);

const removeBoundValues = def(
  'removeBoundValues :: Map NodeId (Map PinKey DataValue) -> Patch -> Map NodeId Node',
  (mapOfPinValues, patch) =>
    R.mapObjIndexed((pinData, nodeId) => {
      const pinKeys = R.keys(pinData);
      return R.compose(
        R.reduce(
          (node, pinKey) => Node.removeBoundValue(pinKey, node),
          R.__,
          pinKeys
        ),
        Patch.getNodeByIdUnsafe(nodeId)
      )(patch);
    }, mapOfPinValues)
);

const uncurryAndAssocNodes = def(
  'uncurryAndAssocNodes :: Map NodeId (Map PinKey DataValue) -> Patch -> Patch',
  (mapOfNodePinValues, patch) =>
    R.compose(
      Patch.upsertNodes(R.__, patch),
      R.values,
      removeBoundValues(mapOfNodePinValues)
    )(patch)
);

const updatePatch = def(
  'updatePatch :: Map NodeId (Map PinKey Link) -> Map NodeId (Map PinKey Node) -> Map NodeId (Map PinKey DataValue) -> Patch -> Patch',
  (mapOfLinks, mapOfNodes, mapOfPinValues, patch) =>
    R.compose(
      explodeEither,
      Patch.upsertLinks(nestedValues(mapOfLinks)),
      Patch.upsertNodes(nestedValues(mapOfNodes)),
      uncurryAndAssocNodes(mapOfPinValues)
    )(patch)
);

const getPathsFromMapOfPinPaths = def(
  'getPathsFromMapOfPinPaths :: Map NodeId (Map PinKey PatchPath) -> [PatchPath]',
  R.compose(R.uniq, nestedValues)
);

const getPatchesFromProject = def(
  'getPatchesFromProject :: [PatchPath] -> Project -> [Patch]',
  (paths, project) =>
    R.map(path => Project.getPatchByPathUnsafe(path, project), paths)
);

const getTuplesOfPatches = def(
  'getTuplesOfPatches :: Map NodeId (Map PinKey PatchPath) -> Project -> [Pair PatchPath Patch]',
  (mapOfPinPaths, project) =>
    R.compose(
      R.converge(R.zip, [R.identity, getPatchesFromProject(R.__, project)]),
      getPathsFromMapOfPinPaths
    )(mapOfPinPaths)
);

const assocPatchesToProject = def(
  'assocPatchesToProject :: [Pair PatchPath Patch] -> Project -> Project',
  (patchPairs, project) =>
    R.reduce(
      (proj, pair) => explodeEither(Project.assocPatch(pair[0], pair[1], proj)),
      project,
      patchPairs
    )
);

// :: { NodeId: { PinKey: PatchPath } } -> Project -> Project -> Project
const copyConstPatches = def(
  'copyConstPatches :: Map NodeId (Map PinKey PatchPath) -> Project -> Project -> Project',
  (mapOfPinPaths, sourceProject, targetProject) =>
    R.compose(assocPatchesToProject(R.__, targetProject), getTuplesOfPatches)(
      mapOfPinPaths,
      sourceProject
    )
);

// It copies patches of needed const*TYPE* into flat project,
// Replaces curried pins with new nodes with curried value (inValue)
// And creates links from them
// And returns updated flat project
const extractBoundInputsToConstNodes = def(
  'extractBoundInputsToConstNodes :: Project -> PatchPath -> Project -> Project',
  (flatProject, path, origProject) => {
    const entryPointPatch = Project.getPatchByPathUnsafe(path, flatProject);
    const entryPointNodes = Patch.listNodes(entryPointPatch);
    const entryPointLinks = Patch.listLinks(entryPointPatch);

    const occupiedNodePins = getMapOfNodePinsWithLinks(
      entryPointNodes,
      entryPointLinks
    );
    const outputNodePins = getMapOfNodeOutputPins(entryPointNodes, origProject);
    const pinsToOmit = R.mergeWith(R.concat, occupiedNodePins, outputNodePins);
    const allInputPinValues = R.compose(
      R.mapObjIndexed((pins, nodeId) =>
        R.omit(R.propOr([], nodeId, pinsToOmit), pins)
      ),
      getMapOfNodePinValues(flatProject)
    )(entryPointNodes);

    const extractablePinPaths = getMapOfExtractablePinPaths(
      allInputPinValues,
      entryPointNodes,
      flatProject
    );
    const constPinKeys = getMapOfPathsToPinKeys(CONST_PATCH_PATHS, origProject);

    const newConstNodes = createNodesWithBoundValues(
      allInputPinValues,
      extractablePinPaths,
      constPinKeys
    );
    const newLinks = createLinksFromCurriedPins(newConstNodes, constPinKeys);
    const newPatch = R.compose(
      R.compose(
        squashSingleOutputNodes('xod/core/boot'),
        squashSingleOutputNodes('xod/core/continuously')
      ),
      updatePatch(newLinks, newConstNodes, allInputPinValues)
    )(entryPointPatch);

    return R.compose(
      explodeEither,
      Project.assocPatch(path, newPatch),
      copyConstPatches(extractablePinPaths, origProject)
    )(flatProject);
  }
);

export default extractBoundInputsToConstNodes;
