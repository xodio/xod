import * as R from 'ramda';
import { explodeMaybe, explodeEither } from 'xod-func-tools';

import { def } from './types';

import * as Pin from './pin';
import * as Node from './node';
import * as Link from './link';
import * as Patch from './patch';
import * as Project from './project';
import { TERMINAL_PIN_KEYS, PIN_DIRECTION } from './constants';
import { getExpandedVariadicPatchPath } from './patchPathUtils';

//
// expanding a single patch
//
// @see https://raw.githubusercontent.com/wiki/xodio/xod/images/illustrations-for-xod-source-code/xod-project/expandVariadicNodes.png

const getNodeX = R.pipe(Node.getNodePosition, R.prop('x'));

const nodeIdLens = R.lens(Node.getNodeId, R.assoc('id'));


// helpers for creating nodes inside expanded patch

const createAdditionalValueTerminalGroups = (
  patch,
  desiredArityLevel,
  originalTerminalNodes,
  variadicPins,
) => {
  const arityStep = R.compose(
    explodeMaybe('Patch is guaranteed to be variadic at this point'),
    Patch.getArityStepFromPatch
  )(patch);

  // for positioning new terminals
  const rightmostInputTerminalX = R.compose(
    xs => Math.max(...xs),
    R.map(getNodeX),
    R.filter(Node.isInputPinNode)
  )(originalTerminalNodes);


  // :: [ Node ]
  const originalValueTerminalNodes = R.compose(
    R.sortBy(getNodeX),
    R.map(R.compose(
      R.flip(Patch.getNodeByIdUnsafe)(patch),
      Pin.getPinKey,
    )),
    R.prop('value'),
  )(variadicPins);

  const DISTANCE_BETWEEN_TERMINALS = 50;
  const valueTerminalsGroupWidth = arityStep * DISTANCE_BETWEEN_TERMINALS;
  const getValueTerminalX = (terminalGroupIndex, terminalIndex) => (
    rightmostInputTerminalX +
    DISTANCE_BETWEEN_TERMINALS +
    // because terminalGroupIndex always starts from 1
    ((terminalGroupIndex - 1) * valueTerminalsGroupWidth) +
    (terminalIndex * DISTANCE_BETWEEN_TERMINALS)
  );

  // :: [ [Node] ]
  return R.compose(
    R.map(terminalGroupIndex => R.addIndex(R.map)((node, index) =>
      R.compose(
        R.over(
          nodeIdLens,
          Pin.addVariadicPinKeySuffix(terminalGroupIndex)
        ),
        Node.setNodePosition({
          x: getValueTerminalX(terminalGroupIndex, index),
          y: 0,
        })
      )(node),
      originalValueTerminalNodes
    )),
    R.range(1), // [1; desiredArityLevel)
  )(desiredArityLevel);
};

const createExpansionNodes = (patch, desiredArityLevel) => {
  const nodeType = Patch.getPatchPath(patch);
  return R.compose(
    R.map(idx => Node.createNode(
      {
        x: 100 * idx,
        y: 100 * idx,
      },
      nodeType
    )),
    R.range(0)
  )(desiredArityLevel);
};


// helpers for linking expanded patch contents

const createLinksToSharedTerminals = (expansionNodes, variadicPinKeys) =>
  R.compose(
    R.chain(sharedPinKey => R.map(instanceNodeId => Link.createLink(
      sharedPinKey, instanceNodeId,
      // sharedPinKey also acts as a terminal node id
      TERMINAL_PIN_KEYS[PIN_DIRECTION.OUTPUT], sharedPinKey
    ))(expansionNodes)),
    R.prop('shared')
  )(variadicPinKeys);

const createLinksFromLastNodeToOutputs = (expansionNodeIds, variadicPinKeys) => {
  const lastNodeId = R.last(expansionNodeIds);
  return R.map(
    outputPinKey => Link.createLink(
      // outputPinKey also acts as a terminal node id
      TERMINAL_PIN_KEYS[PIN_DIRECTION.INPUT], outputPinKey,
      outputPinKey, lastNodeId
    ),
    variadicPinKeys.outputs
  );
};
const createLinksFromFirstNodeToInputTerminals = (expansionNodeIds, variadicPinKeys) => {
  const firstNodeId = R.head(expansionNodeIds);

  return R.map(
    pinKey => Link.createLink(
      pinKey, firstNodeId,
      // pinKey also acts as a terminal node id
      TERMINAL_PIN_KEYS[PIN_DIRECTION.OUTPUT], pinKey
    ),
    R.concat(variadicPinKeys.acc, variadicPinKeys.value)
  );
};

const createLinksToAdditionalValueTerminals =
  (variadicPinKeys, additionalValueTerminalGroups, expansionNodeIds) =>
    R.compose(
      R.chain(([terminalNodes, instanceNodeId]) =>
        R.compose(
          R.map(([valuePinKey, terminalNodeId]) => Link.createLink(
            valuePinKey, instanceNodeId,
            TERMINAL_PIN_KEYS[PIN_DIRECTION.OUTPUT], terminalNodeId
          )),
          R.zip(variadicPinKeys.value),
          R.map(Node.getNodeId)
        )(terminalNodes)
      ),
      R.zip(additionalValueTerminalGroups), // :: [ (NodeId, [Node]) ]
      R.tail
    )(expansionNodeIds);


const createLinksFromNodeOutputsToAccPins = (variadicPinKeys, expansionNodeIds) => {
  const accOutPinKeyPairs = R.zip(variadicPinKeys.acc, variadicPinKeys.outputs);
  return R.compose(
    R.chain(([outputNodeId, inputNodeId]) => R.map(
      ([accPinKey, outputPinKey]) => Link.createLink(
        accPinKey, inputNodeId,
        outputPinKey, outputNodeId,
      ),
      accOutPinKeyPairs
    )),
    R.aperture(2)
  )(expansionNodeIds);
};

const expandPatch = R.curry((desiredArityLevel, patch) => {
  const expandedPatchPath = R.compose(
    getExpandedVariadicPatchPath(desiredArityLevel),
    Patch.getPatchPath
  )(patch);

  // :: {
  //   acc :: [Pin],
  //   value :: [Pin],
  //   shared :: [Pin],
  //   outputs :: [Pin],
  // }
  const variadicPins = R.compose(
    R.map(R.sortBy(Pin.getPinOrder)),
    explodeEither,
    Patch.computeVariadicPins
  )(patch);

  // :: [Node]
  const originalTerminalNodes = R.compose(
    R.filter(Node.isPinNode),
    Patch.listNodes
  )(patch);

  // :: [ [Node] ]
  const additionalValueTerminalGroups = createAdditionalValueTerminalGroups(
    patch,
    desiredArityLevel,
    originalTerminalNodes,
    variadicPins,
  );

  // :: [Node]
  const expansionNodes = createExpansionNodes(patch, desiredArityLevel);


  const variadicPinKeys = R.map(
    R.map(Pin.getPinKey),
    variadicPins
  );

  const expansionNodeIds = R.map(
    Node.getNodeId,
    expansionNodes
  );

  return R.compose(
    explodeEither,
    Patch.upsertLinks([
      ...createLinksToSharedTerminals(expansionNodes, variadicPinKeys),
      ...createLinksFromLastNodeToOutputs(expansionNodeIds, variadicPinKeys),
      ...createLinksFromFirstNodeToInputTerminals(expansionNodeIds, variadicPinKeys),
      ...createLinksToAdditionalValueTerminals(
          variadicPinKeys,
          additionalValueTerminalGroups,
          expansionNodeIds
        ),
      ...createLinksFromNodeOutputsToAccPins(variadicPinKeys, expansionNodeIds),
    ]),
    Patch.upsertNodes([
      ...originalTerminalNodes,
      ...R.unnest(additionalValueTerminalGroups),
      ...expansionNodes,
    ]),
    Patch.setPatchPath(expandedPatchPath),
    Patch.createPatch
  )();
});

//
// expand all patches(starting from a specified entry patch)
//

export default def(
  'expandVariadicNodes :: PatchPath -> Project -> Project',
  (entryPatchPath, project) => {
    const deps = Project.getPatchDependencies(entryPatchPath, project);

    // :: { patchPath, node }
    const nodesToExpand = R.compose(
      R.chain(patchPath => R.compose(
        R.map(node => ({
          patchPath,
          node,
        })),
        R.filter(R.pipe(Node.getNodeArityLevel, al => al > 1)),
        Patch.listNodes,
        Project.getPatchByPathUnsafe(patchPath)
      )(project)),
      R.append(entryPatchPath)
    )(deps);

    const expandedPatches = R.compose(
      R.map(({ patchPath, desiredArityLevel }) =>
        R.compose(
          expandPatch(desiredArityLevel),
          Project.getPatchByPathUnsafe(patchPath)
        )(project)
      ),
      R.uniq,
      R.map(R.compose(
        R.applySpec({
          patchPath: Node.getNodeType,
          desiredArityLevel: Node.getNodeArityLevel,
        }),
        R.prop('node')
      ))
    )(nodesToExpand);


    // :: [ Patch -> Patch ]
    const expandedNodeTypeUpdaters = R.compose(
      R.values,
      R.mapObjIndexed((nodes, patchPath) => R.compose(
        explodeEither,
        Project.updatePatch(patchPath, (patch) => {
          const updatedNodes = R.map(
            (node) => {
              const arityLevel = Node.getNodeArityLevel(node);
              const originalType = Node.getNodeType(node);
              const expandedNodeType = getExpandedVariadicPatchPath(arityLevel, originalType);
              return Node.setNodeType(expandedNodeType, node);
            },
            nodes
          );

          return Patch.upsertNodes(updatedNodes, patch);
        })
      )),
      R.map(R.map(R.prop('node'))),
      R.groupBy(R.prop('patchPath'))
    )(nodesToExpand);

    return R.compose(
      ...expandedNodeTypeUpdaters,
      Project.assocPatchListUnsafe(expandedPatches)
    )(project);
  }
);
