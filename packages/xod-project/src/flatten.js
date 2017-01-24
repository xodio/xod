import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

import * as CONST from './constants';
import * as Project from './project';
import * as Patch from './patch';
import * as Node from './node';
import * as Link from './link';
import { explode } from './utils';

// :: Monad a -> Monad a
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
const replaceTerminalsWithCast = R.curry((patch, path) => R.compose(
  R.append(R.__, [path]),
  R.cond([
    [R.equals('xod/core/inputBool'), R.always(CONST.CAST_PATCHES.BOOLEAN)],
    [R.equals('xod/core/outputBool'), R.always(CONST.CAST_PATCHES.BOOLEAN)],
    [R.T, R.always(patch)],
  ]))(path));

// :: String[] -> Project -> Path -> [Path, Patch, ...]
const extractImplPatches = R.curry((impls, project, path, patch) => R.ifElse(
    isEndpointPatch(impls),
    endpointPatch => replaceTerminalsWithCast(endpointPatch, path),
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
  R.contains(R.__, implPatchPaths),
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
  const newId = getPrefixedId(prefix, id);
  return R.assoc('id', newId, node);
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
      const newInNodeId = getPrefixedId(parentNodeId, outNodeId);

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

export default R.curry((project, path, impls) => {
  const patch = explode(Project.getPatchByPath(path, project));

  // Maybe [path, Patch, path, Patch, ...]
  const implPatches = extractImplPatches(impls, project, path, patch);
  // [[path, Patch], ...]
  const splittedImplPatches = R.splitEvery(2, implPatches);

  if (R.isEmpty(splittedImplPatches)) {
    return Either.Left(new Error(CONST.ERROR.IMPLEMENTATION_NOT_FOUND));
  }

  // [fn, ...]
  const assocImplPatches = splittedImplPatches.map(R.apply(Project.assocPatch));

  const assocPatch = R.ifElse(
    Patch.hasImpl(impls),
    R.always(R.identity),
    (originalPatch) => {
      const implPatchPaths = R.pluck(0, splittedImplPatches);
      const nodes = extractNodes(project, implPatchPaths, null, originalPatch);
      const assocNodes = nodes.map(node => Patch.assocNode(node));

      const links = extractLinks(project, implPatchPaths, null, originalPatch);
      const assocLinks = links.map(link => R.compose(
        explode,
        Patch.assocLink(link)
      ));

      const patchUpdaters = R.concat(assocNodes, assocLinks);
      const newPatch = R.reduce((p, fn) => fn(p), Patch.createPatch(), patchUpdaters);

      return R.chain(Project.assocPatch(path, newPatch));
    }
  )(patch);

  return R.compose(
    assocPatch,
    reduceChainOver(R.__, assocImplPatches),
    Maybe.of
  )(Project.createProject());
});
