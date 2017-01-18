import R from 'ramda';
import { Maybe } from 'ramda-fantasy';

import * as Project from './project';
import * as Patch from './patch';
import * as Node from './node';

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

// :: Project -> String[] -> Patch -> Node[]
const extractNodes = (project, implPatchPaths) => R.compose(
  R.chain(R.ifElse(
      isNodeToImplPatch(implPatchPaths),
      R.identity,
      R.compose(
        R.chain(patch => extractNodes(project, implPatchPaths)(patch)),
        type => Project.getPatchByPath(type, project),
        Node.getNodeType
      )
    )
  ),
  Patch.listNodes
);

export default R.curry((project, path, impls) => {
  const patch = Project.getPatchByPath(path, project);

  const implPatches = patch
    .map(extractImplPatches(impls, project, path))
    .chain(R.splitEvery(2));
  const assocImplPatches = implPatches.map(R.apply(Project.assocPatch));

  let assocPatch = R.identity;

  if (!patch.chain(Patch.hasImpl(impls))) {
    const implPatchPaths = R.pluck(0, implPatches);
    const nodes = patch.chain(extractNodes(project, implPatchPaths));
    const assocNodes = nodes.map(node => Patch.assocNode(node));

    const newPatch = R.reduce(
      (p, fn) => fn(p),
      Patch.createPatch(),
      assocNodes
    );
    assocPatch = R.compose(
      R.chain,
      Project.assocPatch(path)
    )(newPatch);
  }

  return R.compose(
    assocPatch,
    reduceChainOver(R.__, assocImplPatches),
    Maybe.of
  )(Project.createProject());
});
