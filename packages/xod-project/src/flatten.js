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

// :: String[] -> Project -> Path -> [Path, Patch, ...]
const extractImplPatches = R.curry((impls, project, path, patch) => R.ifElse(
    Patch.hasImpl(impls),
    patchWithImpl => [path, patchWithImpl],
    R.compose(
      R.chain(R.compose(
        type => Project.getPatchByPath(type, project)
          .chain(extractImplPatches(impls, project, type)),
        Node.getNodeType
      )),
      Patch.listNodes
    )
)(patch));

// :: Node -> Boolean
const isNodeToImplPatch = implPatchPaths => R.compose(
  R.contains(R.__, implPatchPaths),
  Node.getNodeType
);

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
          .chain(extractNodes(project, implPatchPaths, id));
      }
    )
  ),
  Patch.listNodes
)(patch));

// :: String[] -> Patch -> NodeId
const isNodeIdPointsToImplPatch = (implPatchPaths, patch) => R.compose(
  R.contains(R.__, implPatchPaths),
  Node.getNodeType,
  explode,
  Patch.getNodeById(R.__, patch)
);

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
  const inId = Link.getLinkInputNodeId(link);

  const newId = getPrefixedId(prefix, id);
  const newOutId = getPrefixedId(prefix, outId);
  const newInId = getPrefixedId(prefix, inId);

  return R.compose(
    R.assocPath(['input', 'nodeId'], newInId),
    R.assocPath(['output', 'nodeId'], newOutId),
    R.assoc('id', newId)
  )(link);
});

// :: Project -> String[] -> Patch -> Link[]
const extractLinks = R.curry((project, implPatchPaths, parentNodeId, patch) => R.compose(
  R.chain(R.ifElse(
    isLinkBetweenImplNodes(implPatchPaths, patch),
    duplicateLinkPrefixed(parentNodeId),
    R.identity // TODO: Recursive extracting links
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
