import R from 'ramda';

import { isAmong, explodeEither } from 'xod-func-tools';

import * as Node from '../node';
import * as Link from '../link';
import * as Patch from '../patch';
import * as Project from '../project';
import { def } from '../types';

const replacePatchContents = def(
  'replacePatchContents :: [Node] -> [Link] -> Patch -> Patch',
  (newNodes, newLinks, patch) =>
    R.compose(
      R.reduce(
        R.compose(explodeEither, R.flip(Patch.assocLink)),
        R.__,
        newLinks
      ),
      R.reduce(
        R.flip(Patch.assocNode),
        R.__,
        newNodes
      ),
      Patch.setPatchDescription(Patch.getPatchDescription(patch)),
      Patch.createPatch
    )()
);

const squashNodes = def(
  'squashNodes :: PatchPath -> PatchPath -> Project -> Project',
  (nodeTypeToSquash, entryPatchPath, flatProject) => {
    const patch = Project.getPatchByPathUnsafe(entryPatchPath, flatProject);
    const allNodes = Patch.listNodes(patch);
    const allLinks = Patch.listLinks(patch);

    const isSquashableNode = R.compose(R.equals(nodeTypeToSquash), Node.getNodeType);
    const nodesToSquash = R.filter(isSquashableNode, allNodes);

    if (nodesToSquash.length <= 1) {
      return flatProject;
    }

    const isLinkFromSquashableNode = R.compose(
      isAmong(R.map(Node.getNodeId, nodesToSquash)),
      Link.getLinkOutputNodeId
    );
    const linksFromSquashableNodes = R.filter(isLinkFromSquashableNode, allLinks);

    if (R.isEmpty(linksFromSquashableNodes)) {
      // TODO: we can cut out 'squashable' nodes here
      return flatProject;
    }

    // here we are assuming that our 'squashable' nodes have a single output pin.
    const squashableNodeOutputPinKey = R.compose(
      Link.getLinkOutputPinKey,
      R.head
    )(linksFromSquashableNodes);

    const squashedNode = R.head(nodesToSquash);
    const squashedNodeId = Node.getNodeId(squashedNode);

    const linksFromSquashedNode = R.map(
      oldLink => Link.createLink(
        Link.getLinkInputPinKey(oldLink),
        Link.getLinkInputNodeId(oldLink),
        squashableNodeOutputPinKey,
        squashedNodeId
      ),
      linksFromSquashableNodes
    );

    const newNodes = R.compose(
      R.append(squashedNode),
      R.reject(isSquashableNode)
    )(allNodes);

    const newLinks = R.compose(
      R.concat(linksFromSquashedNode),
      R.reject(isLinkFromSquashableNode)
    )(allLinks);

    return R.compose(
      explodeEither,
      Project.assocPatch(
        entryPatchPath,
        replacePatchContents(newNodes, newLinks, patch)
      )
    )(flatProject);
  }
);

export default squashNodes;
