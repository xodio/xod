import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { explodeEither, isAmong } from 'xod-func-tools';

import { def } from './types';

import * as Pin from './pin';
import * as Node from './node';
import * as Link from './link';
import * as Patch from './patch';
import * as Project from './project';
import {
  getExpandedVariadicPatchPath,
  isVariadicPassPath,
} from './patchPathUtils';
import { createAdditionalValueTerminalGroups } from './expandVariadicNodes';

const expandPassPatch = R.curry((desiredArityLevel, patch) => {
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
    variadicPins
  );

  const variadicPinKeys = R.compose(R.map(Pin.getPinKey), R.prop('value'))(
    variadicPins
  );

  const linksFromVariadicOutputs = R.compose(
    R.filter(R.pipe(Link.getLinkOutputNodeId, isAmong(variadicPinKeys))),
    Patch.listLinks
  )(patch);
  const nodesConnectedToVariadicInputs = R.compose(
    R.map(nodeId => Patch.getNodeByIdUnsafe(nodeId, patch)),
    R.uniq,
    R.map(Link.getLinkInputNodeId)
  )(linksFromVariadicOutputs);

  const arityLens = R.lens(Node.getNodeArityLevel, Node.setNodeArityLevel);
  const variadicNodesWithAddedArity = R.map(
    R.over(arityLens, R.add(desiredArityLevel - 1)),
    nodesConnectedToVariadicInputs
  );

  const linksFromAdditionalTerminalsToNodesWithAddedArity = R.compose(
    R.chain(terminalGroupIndex =>
      R.map(link => {
        const inputNodeId = Link.getLinkInputNodeId(link);
        const inputPinKey = R.compose(
          R.over(Pin.variadicPinKeySuffixLens, R.add(terminalGroupIndex)),
          Link.getLinkInputPinKey
        )(link);
        const outputNodeId = R.compose(
          Pin.addVariadicPinKeySuffix(terminalGroupIndex),
          Link.getLinkOutputNodeId
        )(link);
        const outputPinKey = Link.getLinkOutputPinKey(link);

        return Link.createLink(
          inputPinKey,
          inputNodeId,
          outputPinKey,
          outputNodeId
        );
      })(linksFromVariadicOutputs)
    ),
    R.range(1) // [1; desiredArityLevel)
  )(desiredArityLevel);

  const markerNode = R.compose(
    R.find(R.pipe(Node.getNodeType, isVariadicPassPath)),
    Patch.listNodes
  )(patch);

  return R.compose(
    Patch.dissocNode(markerNode),
    Patch.upsertLinks(linksFromAdditionalTerminalsToNodesWithAddedArity),
    Patch.upsertNodes([
      ...R.unnest(additionalValueTerminalGroups),
      ...variadicNodesWithAddedArity,
    ]),
    Patch.setPatchPath(expandedPatchPath)
  )(patch);
});

//
// expand all patches(starting from a specified entry patch)
//

const traverseExpandableQueue = (
  queue,
  processed,
  acc,
  processQueueElement
) => {
  if (R.isEmpty(queue)) return acc;

  const [currentQueueElement, ...restQueueElements] = queue;

  if (R.contains(currentQueueElement, processed))
    return traverseExpandableQueue(
      restQueueElements,
      processed,
      acc,
      processQueueElement
    );

  const { result, additionalQueueElements } = processQueueElement(
    currentQueueElement,
    acc
  );

  const updatedQueue = R.compose(
    R.uniq,
    R.concat(restQueueElements),
    R.difference(R.__, processed)
  )(additionalQueueElements);

  return traverseExpandableQueue(
    updatedQueue,
    R.append(currentQueueElement, processed),
    result,
    processQueueElement
  );
};

export default def(
  'expandVariadicPassNodes :: PatchPath -> Project -> Project',
  (entryPatchPath, initialProject) =>
    traverseExpandableQueue(
      [entryPatchPath],
      [],
      initialProject,
      (currentPatchPath, project) => {
        const initialPatch = Project.getPatchByPathUnsafe(
          currentPatchPath,
          project
        );

        const nodesToExpand = R.compose(
          R.filter(
            R.compose(
              Patch.isVariadicPassPatch,
              Project.getPatchByPathUnsafe(R.__, project),
              Node.getNodeType
            )
          ),
          R.filter(R.pipe(Node.getNodeArityLevel, al => al > 1)),
          Patch.listNodes
        )(initialPatch);
        // TODO: short-cirquit if nodesToExpand is empty?

        const expandedPatches = R.compose(
          R.map(({ patchPath, desiredArityLevel }) =>
            R.compose(
              expandPassPatch(desiredArityLevel),
              Project.getPatchByPathUnsafe(patchPath)
            )(project)
          ),
          R.reject(({ patchPath, desiredArityLevel }) =>
            R.compose(
              Maybe.isJust,
              Project.getPatchByPath(
                getExpandedVariadicPatchPath(desiredArityLevel, patchPath)
              )
            )(project)
          ),
          R.uniq,
          R.map(
            R.applySpec({
              patchPath: Node.getNodeType,
              desiredArityLevel: Node.getNodeArityLevel,
            })
          )
        )(nodesToExpand);

        const updatedPatch = R.compose(
          Patch.upsertNodes(R.__, initialPatch),
          R.map(node =>
            R.compose(
              Node.setNodeArityLevel(1),
              Node.setNodeType(
                getExpandedVariadicPatchPath(
                  Node.getNodeArityLevel(node),
                  Node.getNodeType(node)
                )
              )
            )(node)
          )
        )(nodesToExpand);

        const additionalQueueElements = R.compose(
          R.map(Node.getNodeType),
          Patch.listNodes
        )(updatedPatch);

        return {
          result: Project.upsertPatches(
            [updatedPatch, ...expandedPatches],
            project
          ),
          additionalQueueElements,
        };
      }
    )
);
