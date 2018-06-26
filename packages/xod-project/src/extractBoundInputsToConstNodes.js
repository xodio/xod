import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { explodeEither, maybeProp, catMaybies, isAmong } from 'xod-func-tools';

import * as Pin from './pin';
import * as Node from './node';
import * as Link from './link';
import * as Patch from './patch';
import * as Project from './project';
import { ensureLiteral } from './legacy';
import {
  PIN_TYPE,
  CONST_NODETYPES,
  PULSE_CONST_NODETYPES,
  INPUT_PULSE_PIN_BINDING_OPTIONS,
} from './constants';
import squashSingleOutputNodes from './optimizers/squashSingleOutputNodes';
import { isBuiltInType } from './utils';
import { def } from './types';

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
          // 'Never' is not extracted to a constant node.
          // It literally menas "do nothing", so it's just ignored.
          R.reject(R.equals(INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER)),
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
    const nodePins = R.propOr({}, nodeId, nodePinValues);
    return R.has(pinKey, nodePins);
  }
);

const getMapOfNodePinTypes = def(
  'getMapOfNodePinTypes :: Map NodeId (Map PinKey DataValue) -> [Node] -> Project -> Map NodeId (Map PinKey DataType)',
  (mapOfNodePinValues, curriedNodes, project) =>
    R.compose(
      R.mapObjIndexed((patchPath, nodeId) =>
        R.compose(
          R.map(Pin.getPinType),
          R.indexBy(Pin.getPinKey),
          R.filter(isCurriedInNodePin(mapOfNodePinValues, nodeId)),
          Patch.listPins,
          Project.getPatchByPathUnsafe
        )(patchPath, project)
      ),
      getMapOfNodeTypes
    )(curriedNodes)
);

const getMapOfExtractablePinPaths = def(
  'getMapOfExtractablePinPaths :: Map NodeId (Map PinKey DataValue) -> [Node] -> Project -> Map NodeId (Map PinKey PatchPath)',
  R.compose(
    R.reject(R.isEmpty),
    R.map(catMaybies),
    R.map(
      R.map(([pinType, pinValue]) => {
        if (!isBuiltInType(pinType)) {
          // for complex types, type name _is_ the name of constructor node
          return Maybe.Just(pinType);
        }

        // type is a built-in primivive
        return pinType === PIN_TYPE.PULSE
          ? R.compose(
              R.chain(maybeProp(R.__, PULSE_CONST_NODETYPES)),
              ensureLiteral
            )(pinType, pinValue)
          : maybeProp(pinType, CONST_NODETYPES);
      })
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
          // TODO: add more logic here about 'output-self'?
          R.head,
          Patch.listOutputPins,
          Project.getPatchByPathUnsafe(R.__, project)
        )(constPath)
      )
    )(constantPaths)
);

// do not transfer bound values to 'pulse constants'
// and constructors for custom types
// :: PatchPath -> Boolean
const doesConstNodeNeedBoundValue = R.compose(isAmong, R.values)(
  CONST_NODETYPES
);

const createNodesWithBoundValues = def(
  'createNodesWithBoundValues :: Map NodeId (Map PinKey DataValue) -> Map NodeId (Map PinKey PatchPath) -> Map PatchPath PinKey -> Map NodeId (Map PinKey Node)',
  (allInputPinValues, extractablePinPaths, mapOfPinKeys) =>
    R.mapObjIndexed(
      (pinsData, nodeId) =>
        R.compose(
          R.mapObjIndexed((pinValue, pinKey) => {
            const nodeType = R.path([nodeId, pinKey], extractablePinPaths);
            const constPinKey = R.prop(nodeType, mapOfPinKeys);

            return R.compose(
              R.when(
                () => doesConstNodeNeedBoundValue(nodeType),
                Node.setBoundValue(constPinKey, pinValue)
              ),
              Node.createNode({ x: 0, y: 0 })
            )(nodeType);
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

// Replaces curried pins with new nodes with curried value (inValue)
// And creates links from them
const extractBoundInputsToConstNodes = def(
  'extractBoundInputsToConstNodes :: PatchPath -> Project -> Project',
  (path, project) => {
    const entryPointPatch = Project.getPatchByPathUnsafe(path, project);
    const entryPointNodes = Patch.listNodes(entryPointPatch);
    const entryPointLinks = Patch.listLinks(entryPointPatch);

    const occupiedNodePins = getMapOfNodePinsWithLinks(
      entryPointNodes,
      entryPointLinks
    );
    const outputNodePins = getMapOfNodeOutputPins(entryPointNodes, project);
    const pinsToOmit = R.mergeWith(R.concat, occupiedNodePins, outputNodePins);
    const allInputPinValues = R.compose(
      R.reject(R.isEmpty),
      R.mapObjIndexed((pins, nodeId) =>
        R.omit(R.propOr([], nodeId, pinsToOmit), pins)
      ),
      getMapOfNodePinValues(project) // :: Map NodeId (Map PinKey DataValue)
    )(entryPointNodes);

    if (R.isEmpty(allInputPinValues)) {
      return project;
    }

    const extractablePinPaths = getMapOfExtractablePinPaths(
      allInputPinValues,
      entryPointNodes,
      project
    );

    const utilisedConstantsPatchPaths = R.compose(
      R.uniq,
      R.chain(R.values),
      R.values
    )(extractablePinPaths);
    const constPinKeys = getMapOfPathsToPinKeys(
      utilisedConstantsPatchPaths,
      project
    );

    const newConstNodes = createNodesWithBoundValues(
      allInputPinValues,
      extractablePinPaths,
      constPinKeys
    );

    const newLinks = createLinksFromCurriedPins(newConstNodes, constPinKeys);
    const newPatch = R.compose(
      squashSingleOutputNodes('xod/core/boot'),
      squashSingleOutputNodes('xod/core/continuously'),
      updatePatch(newLinks, newConstNodes, allInputPinValues)
    )(entryPointPatch);

    return extractBoundInputsToConstNodes(
      path,
      Project.assocPatchUnsafe(path, newPatch, project)
    );
  }
);

export default extractBoundInputsToConstNodes;
