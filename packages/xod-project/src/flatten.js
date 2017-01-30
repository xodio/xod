import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

import * as CONST from './constants';
import * as Project from './project';
import * as Patch from './patch';
import * as Pin from './pin';
import * as Node from './node';
import * as Link from './link';
import { explode, getCastPatch, getCastPath } from './utils';

const terminalRegExp = /^xod\/core\/(input|output)/;
const getTerminalPins = type => ([
  { key: '__in__', type, direction: CONST.PIN_DIRECTION.INPUT },
  { key: '__out__', type, direction: CONST.PIN_DIRECTION.OUTPUT },
]);
const getTerminalPath = type => `terminal${type}`;
// :: String -> String
const convertTerminalPath = R.compose(
  getTerminalPath,
  R.replace(terminalRegExp, '')
);
// :: Node[] -> Node[]
const filterTerminalNodes = R.filter(R.compose(
  R.test(/^terminal/),
  Node.getNodeType
));
// :: Node -> boolean
const isCastNode = R.compose(
  R.test(/^cast-([a-zA-Z]+)-/),
  Node.getNodeType
);
// :: Node[] -> Link[] -> Link[]
const filterTerminalLinks = R.curry((nodes, links) => R.map(
  R.converge(
    R.concat,
    [
      R.compose(
        R.of,
        Node.getNodeType
      ),
      (node) => {
        const nodeId = Node.getNodeId(node);
        const terminalLinks = R.filter(R.either(
          R.compose(R.equals(nodeId), Link.getLinkInputNodeId),
          R.compose(R.equals(nodeId), Link.getLinkOutputNodeId)
        ), links);

        return R.sort(
          a => ((Link.getLinkOutputNodeId(a) === nodeId) ? 1 : -1),
          terminalLinks
        );
      },
    ]
  ), nodes)
);

// :: Node[] -> String -> String
const getNodeTypeByNodeId = R.curry((nodes, nodeId) => R.compose(
  Node.getNodeType,
  R.find(R.propEq('id', nodeId))
)(nodes));

// :: String -> String -> Patch[] -> String
const getPinTypeFromImplPatches = R.curry((pinKey, nodeType, patches) => R.compose(
  R.chain(Pin.getPinType),
  Patch.getPinByKey(pinKey),
  R.prop(1),
  R.find(R.propEq(0, nodeType))
)(patches));

// :: Node[] -> [[Path, Patch]] -> [[Path, Link, Link]] -> [[PathOld, Path, Patch]]
const convertTerminalToCastPatch = R.curry(
  (nodes, splittedImplPatches, linksToTerminalNodes) =>
    R.map((group) => {
      const path = group[0];
      const entryLink = group[1];
      let result = [path, null];

      if (entryLink) {
        const outputPinKey = Link.getLinkOutputPinKey(entryLink);
        const outputNodeId = Link.getLinkOutputNodeId(entryLink);
        const outputNodeType = getNodeTypeByNodeId(nodes, outputNodeId);

        const inputNodeId = Link.getLinkInputNodeId(entryLink);
        const inputPinKey = Link.getLinkInputPinKey(entryLink);
        const inputNodeType = getNodeTypeByNodeId(nodes, inputNodeId);

        const outputPinType = getPinTypeFromImplPatches(
          outputPinKey, outputNodeType, splittedImplPatches
        );
        const inputPinType = getPinTypeFromImplPatches(
          inputPinKey, inputNodeType, splittedImplPatches
        );

        const castPatch = getCastPatch(outputPinType, inputPinType);
        const castPath = getCastPath(outputPinType, inputPinType);

        result = [path, castPath, castPatch];
      }

      return result;
    }
  )(linksToTerminalNodes)
);

// :: Monad a -> Function[] -> Monad a
const reduceChainOver = R.reduce(R.flip(R.chain));

// :: Project -> String -> Patch
const getPatchByNodeType = R.curry((project, nodeType) => R.compose(
  explode,
  Project.getPatchByPath(R.__, project)
)(nodeType));

// :: String[] -> Patch -> Boolean
const isEndpointPatch = impls => R.either(
  Patch.hasImpl(impls),
  Patch.isTerminalPatch
);

// :: Patch -> String -> [String, Patch]
const extendTerminalPins = R.curry((patch, path) => R.ifElse(
  Patch.isTerminalPatch,
  R.compose(
    R.concat([convertTerminalPath(path)]),
    R.of,
    R.chain(R.identity),
    reduceChainOver(Maybe.of(patch)),
    R.map(Patch.assocPin),
    getTerminalPins,
    Pin.getPinType,
    R.head,
    Patch.listPins
  ),
  R.always([path, patch])
)(patch));

// :: String[] -> Project -> Path -> [Path, Patch, ...]
const extractImplPatches = R.curry((impls, project, path, patch) => R.ifElse(
    isEndpointPatch(impls),
    endpointPatch => extendTerminalPins(endpointPatch, path),
    R.compose(
      R.chain(R.compose(
        type => Project.getPatchByPath(type, project)
          .chain(extractImplPatches(impls, project, type)),
        Node.getNodeType
      )),
      Patch.listNodes
    )
)(patch));

// :: String -> Node
const getNodeById = R.curry((patch, node) => R.compose(
  explode,
  Patch.getNodeById(R.__, patch)
)(node));

// :: String[] -> Node -> Boolean
const isNodeToImplPatch = R.curry((implPatchPaths, node) => R.compose(
  R.either(
    R.contains(R.__, implPatchPaths),
    R.test(terminalRegExp)
  ),
  Node.getNodeType
)(node));

// :: String[] -> Patch -> NodeId
const isNodeIdPointsToImplPatch = R.curry((implPatchPaths, patch, nodeId) => R.compose(
  isNodeToImplPatch(implPatchPaths),
  getNodeById(patch)
)(nodeId));

// :: String -> String -> String
const getPrefixedId = R.curry((prefix, id) => ((prefix) ? `${prefix}~${id}` : id));

// :: String -> Node -> Node
const duplicateNodePrefixed = R.curry((prefix, node) => {
  const id = Node.getNodeId(node);
  const type = Node.getNodeType(node);
  const newType = R.when(
    R.test(terminalRegExp),
    convertTerminalPath
  )(type);
  const newId = getPrefixedId(prefix, id);
  return R.compose(
    R.assoc('id', newId),
    R.assoc('type', newType)
  )(node);
});

// :: Project -> String[] -> Patch -> Node[]
const extractNodes = R.curry((project, implPatchPaths, parentNodeId, patch) => R.compose(
  R.chain(R.ifElse(
      isNodeToImplPatch(implPatchPaths),
      duplicateNodePrefixed(parentNodeId),
      (node) => {
        const type = Node.getNodeType(node);
        const id = Node.getNodeId(node);
        return Project.getPatchByPath(type, project)
          .chain(
            extractNodes(project, implPatchPaths, getPrefixedId(parentNodeId, id))
          );
      }
    )
  ),
  Patch.listNodes
)(patch));

// :: Link -> Boolean
const isLinkBetweenImplNodes = (implPatchPaths, patch) => R.converge(
  R.and,
  [
    R.compose(isNodeIdPointsToImplPatch(implPatchPaths, patch), Link.getLinkOutputNodeId),
    R.compose(isNodeIdPointsToImplPatch(implPatchPaths, patch), Link.getLinkInputNodeId),
  ]
);

// :: String -> Link -> Link
const duplicateLinkPrefixed = R.curry((prefix, link) => {
  const id = Link.getLinkId(link);
  const outId = Link.getLinkOutputNodeId(link);
  const outKey = Link.getLinkOutputPinKey(link);
  const inId = Link.getLinkInputNodeId(link);
  const inKey = Link.getLinkInputPinKey(link);

  const newId = getPrefixedId(prefix, id);
  const newOutId = getPrefixedId(prefix, outId);
  const newInId = getPrefixedId(prefix, inId);

  return R.assoc('id', newId, Link.createLink(inKey, newInId, outKey, newOutId));
});

// :: Project -> String[] -> Patch -> Link[]
const extractLinks = R.curry((project, implPatchPaths, parentNodeId, patch) => R.compose(
  R.chain(R.ifElse(
    isLinkBetweenImplNodes(implPatchPaths, patch),
    duplicateLinkPrefixed(parentNodeId),
    (link) => {
      // TODO: Refactoring needed!
      const outNodeId = Link.getLinkOutputNodeId(link);
      const inNodeId = Link.getLinkInputNodeId(link);
      const outPinKey = Link.getLinkOutputPinKey(link);
      const inPinKey = Link.getLinkInputPinKey(link);

      const outNode = getNodeById(patch, outNodeId);
      const newOutNodeId = getPrefixedId(parentNodeId, outNodeId);

      const inNode = getNodeById(patch, inNodeId);
      const newInNodeId = getPrefixedId(parentNodeId, inNodeId);

      let newLink = Link.createLink();
      let inLinks = [];
      let outLinks = [];

      // input
      if (!isNodeToImplPatch(implPatchPaths, inNode)) {
        const inNodeType = Node.getNodeType(inNode);
        const inPatch = getPatchByNodeType(project, inNodeType);
        inLinks = extractLinks(project, implPatchPaths, newInNodeId, inPatch);
        const inNodeIdWithPinKey = getPrefixedId(newInNodeId, inPinKey);

        newLink = newLink('__in__', inNodeIdWithPinKey);
      } else {
        newLink = newLink(inPinKey, inNodeId);
      }

      // output
      if (!isNodeToImplPatch(implPatchPaths, outNode)) {
        const outNodeType = Node.getNodeType(outNode);
        const outPatch = getPatchByNodeType(project, outNodeType);
        outLinks = extractLinks(project, implPatchPaths, newOutNodeId, outPatch);
        const outNodeIdWithPinKey = getPrefixedId(newOutNodeId, outPinKey);

        newLink = newLink('__out__', outNodeIdWithPinKey);
      } else {
        newLink = newLink(outPinKey, outNodeId);
      }

      newLink = R.assoc('id', getPrefixedId(parentNodeId, Link.getLinkId(link)), newLink);

      return R.concat([newLink], R.concat(inLinks, outLinks));
    }
  )),
  Patch.listLinks
)(patch));

// :: Link[] -> Node -> Boolean
const filterCastNodesWithBothLinks = R.curry((links, node) => {
  if (R.not(isCastNode(node))) { return true; }

  const nodeId = Node.getNodeId(node);
  return R.compose(
    R.equals(2),
    R.length,
    R.filter(R.either(
      R.compose(R.equals(nodeId), Link.getLinkOutputNodeId),
      R.compose(R.equals(nodeId), Link.getLinkInputNodeId)
    ))
  )(links);
});

// :: Node[] -> Link -> Boolean
const filterLinksToExistingNodes = R.curry((nodes, link) => {
  const nodeIds = R.pluck('id', nodes);
  const isNodeExist = R.contains(R.__, nodeIds);

  return R.both(
    R.compose(isNodeExist, Link.getLinkOutputNodeId),
    R.compose(isNodeExist, Link.getLinkInputNodeId)
  )(link);
});

// :: Node[] -> [Path, Patch] -> Boolean
const filterEndpointsByUsedNodes = R.curry((nodes, splittedPatch) => {
  const nodeTypes = R.pluck('type', nodes);
  const isNodeTypeExists = R.contains(R.__, nodeTypes);

  return R.compose(isNodeTypeExists, R.prop(0))(splittedPatch);
});

export default R.curry((project, path, impls) => {
  const patch = explode(Project.getPatchByPath(path, project));

  // Maybe [path, Patch, path, Patch, ...]
  const implPatches = extractImplPatches(impls, project, path, patch);
  // [[path, Patch], ...]
  const splittedImplPatches = R.splitEvery(2, implPatches);

  if (R.isEmpty(splittedImplPatches)) {
    return Either.Left(new Error(CONST.ERROR.IMPLEMENTATION_NOT_FOUND));
  }

  let splittedEndpointPatches = splittedImplPatches;

  const assocPatch = R.ifElse(
    Patch.hasImpl(impls),
    R.always(R.identity),
    (originalPatch) => {
      const implPatchPaths = R.pluck(0, splittedImplPatches);
      const nodes = extractNodes(project, implPatchPaths, null, originalPatch);

      const links = extractLinks(project, implPatchPaths, null, originalPatch);

      const terminalNodes = filterTerminalNodes(nodes);
      const linksToTerminalNodes = filterTerminalLinks(terminalNodes, links);
      const castPatches = convertTerminalToCastPatch(
        nodes,
        splittedImplPatches,
        linksToTerminalNodes
      );

      // Replacing terminal node types with cast node types
      const nodesWithCastNodes = R.compose(
        R.filter(filterCastNodesWithBothLinks(links)),
        R.reject(R.isNil),
        R.map((node) => {
          const type = Node.getNodeType(node);
          const castPatch = R.find(R.propEq(0, type), castPatches);
          if (castPatch && castPatch[1] === null) return null;
          return (castPatch) ? R.assoc('type', castPatch[1], node) : node;
        })
      )(nodes);


      // Replace terminal patches in splittedImplPatches with casting patches
      // TODO: Try to get rid of side effect!
      splittedEndpointPatches = R.compose(
        R.filter(filterEndpointsByUsedNodes(nodesWithCastNodes)),
        R.reject(R.isNil),
        R.map((group) => {
          const endpointPath = group[0];
          const castPatch = R.find(R.propEq(0, endpointPath), castPatches);
          if (castPatch && castPatch[1] === null) return null;
          return (castPatch) ? [castPatch[1], castPatch[2]] : group;
        })
      )(splittedImplPatches);

      const filteredLinks = R.filter(filterLinksToExistingNodes(nodesWithCastNodes), links);

      const assocNodes = nodesWithCastNodes.map(node => Patch.assocNode(node));
      const assocLinks = filteredLinks.map(link => R.compose(explode, Patch.assocLink(link)));
      const patchUpdaters = R.concat(assocNodes, assocLinks);
      const newPatch = R.reduce((p, fn) => fn(p), Patch.createPatch(), patchUpdaters);

      return R.chain(Project.assocPatch(path, newPatch));
    }
  )(patch);

  // [fn, ...]
  const assocImplPatches = splittedEndpointPatches.map(R.apply(Project.assocPatch));

  return R.compose(
    assocPatch,
    reduceChainOver(R.__, assocImplPatches),
    Maybe.of
  )(Project.createProject());
});
