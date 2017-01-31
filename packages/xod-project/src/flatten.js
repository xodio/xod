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
// :: Node[] -> Link[] -> Link[]
const filterTerminalLinks = R.curry((nodes, links) => R.map(
  (node) => {
    const nodeId = Node.getNodeId(node);
    return R.filter(R.either(
      R.compose(R.equals(nodeId), Link.getLinkInputNodeId),
      R.compose(R.equals(nodeId), Link.getLinkOutputNodeId)
    ), links);
  },
  nodes
));

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
        const prefixedId = getPrefixedId(parentNodeId, id);
        const pinsPrefixed = R.compose(
          R.fromPairs,
          R.map(R.over(R.lensIndex(0), getPrefixedId(prefixedId))),
          R.toPairs,
          R.propOr({}, 'pins')
        )(node);
        const pinKeys = R.keys(pinsPrefixed);
        const isPinKeyExist = R.contains(R.__, pinKeys);
        const newNodes = Project.getPatchByPath(type, project).chain(
          extractNodes(project, implPatchPaths, prefixedId)
        ).map((newNode) => {
          const nodeId = Node.getNodeId(newNode);
          if (isPinKeyExist(nodeId)) {
            return R.assocPath(['pins', '__in__'], pinsPrefixed[nodeId], newNode);
          }

          return newNode;
        });

        return newNodes;
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
  R.uniqWith(R.eqBy(Link.getLinkId)),
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

const getPinType = R.curry((patchTuples, nodes, idGetter, keyGetter, link) =>
  R.compose(
    Pin.getPinType,
    explode,
    R.converge(
      // = PinKey + Patch -> Pin
      Patch.getPinByKey,
      [
        // Link -> PinKey
        keyGetter,
        // Link -> NodeId -> Node -> NodeType -> Patch
        R.compose(
          R.prop(1),
          R.find(R.__, patchTuples),
          R.propEq(0),
          Node.getNodeType,
          R.find(R.__, nodes),
          R.propEq('id'),
          idGetter
        ),
      ]
    )
  )(link)
);

// :: [[Path, Patch]] -> Node[] -> Link -> Node
const createCastNode = R.curry((patchTuples, nodes, link) => R.compose(
  R.chain(type => ({
    id: `${Link.getLinkOutputNodeId(link)}-to-${Link.getLinkInputNodeId(link)}`,
    type,
  })),
  // Link -> Maybe String
  R.converge(
    R.ifElse(
      R.equals,
      Maybe.Nothing,
      R.compose(Maybe.of, getCastPath)
    ),
    [
      getPinType(patchTuples, nodes, Link.getLinkOutputNodeId, Link.getLinkOutputPinKey),
      getPinType(patchTuples, nodes, Link.getLinkInputNodeId, Link.getLinkInputPinKey),
    ]
  )
)(link));

// :: [[Path, Patch]] -> Node[] -> Link -> [ Node|Null, Link[] ]
const splitLinkWithCastNode = R.curry((patchTuples, nodes, link) => {
  const castNode = createCastNode(patchTuples, nodes, link);

  if (Maybe.isNothing(castNode)) {
    return [null, [link]];
  }

  const origLinkId = Link.getLinkId(link);
  const fromNodeId = Link.getLinkOutputNodeId(link);
  const fromPinKey = Link.getLinkOutputPinKey(link);
  const toNodeId = Link.getLinkInputNodeId(link);
  const toPinKey = Link.getLinkInputPinKey(link);

  const toCastNode = R.assoc('id', `${origLinkId}-to-cast`,
    Link.createLink('__in__', castNode.id, fromPinKey, fromNodeId)
  );
  const fromCastNode = R.assoc('id', `${origLinkId}-from-cast`,
    Link.createLink(toPinKey, toNodeId, '__out__', castNode.id)
  );

  return [castNode, [toCastNode, fromCastNode]];
});

// :: String -> Link[] -> Link[]
const filterOutputLinksByNodeId = R.curry((nodeId, links) => R.filter(
  R.compose(
    R.equals(nodeId),
    Link.getLinkOutputNodeId
  ),
  links
));

// :: String -> Node[] -> Node
const findNodeByNodeId = R.curry((nodeId, nodes) => R.find(
  R.compose(
    R.equals(nodeId),
    Node.getNodeId
  ),
  nodes
));

// :: String[] -> Node[] -> Node[]
const rejectContainedNodeIds = R.curry((nodeIds, nodes) => R.reject(
  R.compose(
    R.contains(R.__, nodeIds),
    Node.getNodeId
  ),
  nodes
));

// :: Node[] -> Link[] -> Node[] -> Node[]
const passPinsFromTerminalNodes = R.curry((nodes, terminalLinks, terminalNodes) =>
  R.map(terminalNode =>
    R.compose(
      R.map(R.compose(
        R.assoc('pins', terminalNode.pins),
        findNodeByNodeId(R.__, nodes),
        Link.getLinkInputNodeId
      )),
      filterOutputLinksByNodeId(R.__, terminalLinks),
      Node.getNodeId
    )(terminalNode),
    terminalNodes
  )
);

// TODO: Refactoring needed
// :: [ Node[], Link[] ] -> [ Node[], Link[] ]
const removeTerminalsAndPassPins = ([nodes, links]) => {
  const terminalNodes = filterTerminalNodes(nodes);
  const terminalLinks = filterTerminalLinks(terminalNodes, links);

  const terminalNodesWithPins = R.filter(R.has('pins'), terminalNodes);
  const nodesWithPins = R.compose(
    R.flatten,
    passPinsFromTerminalNodes(nodes, R.flatten(terminalLinks))
  )(terminalNodesWithPins);
  const nodesWithPinsIds = R.map(Node.getNodeId, nodesWithPins);

  const terminalNodeIds = R.compose(R.pluck('id'), R.flatten)(terminalNodes);

  const newNodes = R.compose(
    R.concat(R.__, nodesWithPins),
    rejectContainedNodeIds(nodesWithPinsIds),
    rejectContainedNodeIds(R.__, nodes),
    R.pluck('id'),
    R.flatten
  )(terminalNodes);

  const linkIdsToRemove = R.compose(
    R.pluck('id'),
    R.flatten
  )(terminalLinks);
  const linksWithoutTerminals = R.reject(
    R.compose(
      R.contains(R.__, linkIdsToRemove),
      Link.getLinkId
    ),
    links
  );

  const newLinks = R.compose(
    R.concat(linksWithoutTerminals),
    R.map((linkPair) => {
      const outputLink = R.find(
        R.compose(
          R.contains(R.__, terminalNodeIds),
          Link.getLinkInputNodeId
        ),
        linkPair
      );
      const inputLink = R.find(
        R.compose(
          R.contains(R.__, terminalNodeIds),
          Link.getLinkOutputNodeId
        ),
        linkPair
      );
      const linkId = Link.getLinkId(inputLink);
      const newLink = Link.createLink(
        Link.getLinkInputPinKey(inputLink),
        Link.getLinkInputNodeId(inputLink),
        Link.getLinkOutputPinKey(outputLink),
        Link.getLinkOutputNodeId(outputLink)
      );

      return R.assoc('id', linkId, newLink);
    }),
    R.filter(R.compose(R.gt(R.__, 1), R.length))
  )(terminalLinks);

  return [newNodes, newLinks];
};

// :: [[Path, Patch]] -> Node[] -> Link[] -> [ Node[], Link[] ]
const createCastNodes = R.curry((patchTuples, nodes, links) => R.compose(
  removeTerminalsAndPassPins,
  R.converge(
    (newNodes, newLinks) => ([newNodes, newLinks]),
    [
      R.compose(R.concat(nodes), R.reject(R.isNil), R.pluck(0)),
      R.compose(R.flatten, R.pluck(1)),
    ]
  ),
  R.map(splitLinkWithCastNode(patchTuples, nodes))
)(links));

const castTypeRegExp = /^cast-([a-zA-Z]+)-to-([a-zA-Z]+)$/;
// :: String -> Boolean
const testCastType = R.test(castTypeRegExp);

// :: Node[] -> String[]
const getCastNodeTypes = R.compose(
  R.filter(testCastType),
  R.map(Node.getNodeType)
);

// :: String -> Patch
const createCastPatchFromType = R.compose(
  R.converge(
    getCastPatch,
    [
      R.prop(1),
      R.prop(2),
    ]
  ),
  R.match(castTypeRegExp)
);

// :: String[] -> [[Path, Patch]] -> [[Path, Patch]]
const addCastPatches = R.curry((castTypes, splittedImplPatches) => R.compose(
  R.concat(splittedImplPatches),
  R.map(
    R.converge(
      R.append,
      [
        createCastPatchFromType,
        R.of,
      ]
    )
  ),
  R.uniq
)(castTypes));

// :: [[Path, Patch]] -> [[Path, Patch]]
const removeTerminalPatches = R.reject(R.compose(
  R.test(/^terminal[a-zA-Z]+$/),
  R.prop(0)
));


export default R.curry((project, path, impls) => {
  const patch = explode(Project.getPatchByPath(path, project));

  // Maybe [path, Patch, path, Patch, ...]
  const implPatches = extractImplPatches(impls, project, path, patch);
  // [[path, Patch], ...]
  const splittedImplPatches = R.compose(
    R.uniqWith(R.eqBy(R.prop(0))),
    R.splitEvery(2)
  )(implPatches);

  if (R.isEmpty(splittedImplPatches)) {
    return Either.Left(new Error(CONST.ERROR.IMPLEMENTATION_NOT_FOUND));
  }

  let splittedEndpointPatches = splittedImplPatches;

  const assocPatch = R.ifElse(
    Patch.hasImpl(impls),
    R.always(R.identity),
    (originalPatch) => {
      // TODO: Refactoring needed
      const implPatchPaths = R.pluck(0, splittedImplPatches);
      const nodes = extractNodes(project, implPatchPaths, null, originalPatch);
      const links = extractLinks(project, implPatchPaths, null, originalPatch);

      const [newNodes, newLinks] = createCastNodes(splittedImplPatches, nodes, links);
      const usedCastNodeTypes = getCastNodeTypes(newNodes);

      // TODO: Try to get rid of the side effect
      splittedEndpointPatches = R.compose(
        removeTerminalPatches,
        addCastPatches(usedCastNodeTypes)
      )(splittedImplPatches);

      const assocNodes = newNodes.map(node => Patch.assocNode(node));
      const assocLinks = newLinks.map(link => R.compose(explode, Patch.assocLink(link)));
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
