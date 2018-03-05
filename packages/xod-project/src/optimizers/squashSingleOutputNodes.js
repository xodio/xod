import * as R from 'ramda';

import { isAmong, explodeEither } from 'xod-func-tools';

import * as Node from '../node';
import * as Link from '../link';
import * as Patch from '../patch';
import { def } from '../types';

const replacePatchContents = def(
  'replacePatchContents :: [Node] -> [Link] -> Patch -> Patch',
  (newNodes, newLinks, patch) =>
    R.compose(
      explodeEither,
      Patch.upsertLinks(newLinks),
      Patch.upsertNodes(newNodes),
      Patch.setPatchDescription(Patch.getPatchDescription(patch)),
      Patch.createPatch
    )()
);

const squashSingleOutputNodes = def(
  'squashSingleOutputNodes :: PatchPath -> Patch -> Patch',
  (nodeTypeToSquash, patch) => {
    const allNodes = Patch.listNodes(patch);
    const allLinks = Patch.listLinks(patch);

    const isSquashableNode = R.compose(
      R.equals(nodeTypeToSquash),
      Node.getNodeType
    );
    const nodesToSquash = R.filter(isSquashableNode, allNodes);

    if (nodesToSquash.length <= 1) {
      return patch;
    }

    const isLinkFromSquashableNode = R.compose(
      isAmong(R.map(Node.getNodeId, nodesToSquash)),
      Link.getLinkOutputNodeId
    );
    const linksFromSquashableNodes = R.filter(
      isLinkFromSquashableNode,
      allLinks
    );

    if (R.isEmpty(linksFromSquashableNodes)) {
      // Our 'squashable' nodes are just hanging there, not connected to anything.
      // That's a job for a different optimization.
      return patch;
    }

    // because we are assuming that our 'squashable' nodes have a single output pin:
    const squashableNodeOutputPinKey = R.compose(
      Link.getLinkOutputPinKey,
      R.head
    )(linksFromSquashableNodes);

    const squashedNode = R.head(nodesToSquash);
    const squashedNodeId = Node.getNodeId(squashedNode);

    const linksFromSquashedNode = R.map(
      oldLink =>
        Link.createLink(
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

    return replacePatchContents(newNodes, newLinks, patch);
  }
);

export default squashSingleOutputNodes;
