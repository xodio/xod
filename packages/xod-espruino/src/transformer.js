
import R from 'ramda';
import { PIN_DIRECTION, PIN_TYPE, mapIndexed, indexById, sortGraph, generateId } from 'xod-core';

// TODO: remove following ESLint shunt. It barks on unused `_` in arrow funcs.
// We should make smarter selectors for source & destination pins without _ hack
/* eslint-disable no-unused-vars */

// From: https://github.com/ramda/ramda/wiki/Cookbook#rename-keys-of-an-object
/**
 * Creates a new object with the own properties of the provided object, but the
 * keys renamed according to the keysMap object as `{oldKey: newKey}`.
 * When some key is not found in the keysMap, then it's passed as-is.
 *
 * Keep in mind that in the case of keys conflict is behaviour undefined and
 * the result may vary between various JS engines!
 *
 * @sig {a: b} -> {a: *} -> {b: *}
 */
const renameKeys = R.curry(
  (keysMap, obj) => R.reduce(
    (acc, key) => R.assoc(keysMap[key] || key, obj[key], acc),
    {},
    R.keys(obj)
  )
);

// :: [k] -> {k: v} -> v | Undefined -- returns a value in obj for
//    an existing key that found first in priorityKeys
const priorityValue = R.curry(
  (priorityKeys, obj) => {
    const key = R.head(R.intersection(priorityKeys, R.keys(obj)));
    return R.prop(key, obj);
  }
);

// ----------------
// TODO: move to xod-core? (with all other selectors)
const makeTypeTest = regex =>
  (node, prop = 'typeId') => R.propSatisfies(R.test(regex), prop, node);
const isInputNode = makeTypeTest(/^xod\/core\/input/);
const isOutputNode = makeTypeTest(/^xod\/core\/output/);
// ----------------

// :: Patch -> Boolean
const isPatchNodeType = R.compose(
  R.any(R.either(isInputNode, isOutputNode)),
  R.values,
  R.propOr({}, 'nodes')
);

/**
  * Transforms JSON data as it seen it *.xod files to
  * a shape expected by the runtime.
  *
  * @param {Object} project -- project from app world
  * @param {Array.<String>} implPlatforms -- allowed platforms to extract
  *   implementation for given in prioritized list. E.g. ['espruino', 'js'].
  */
export default function transform(project, implPlatforms = []) {
  const nodeTypes = R.propOr({}, 'nodeTypes', project);
  const nodeTypeByKey = key => R.propOr({}, key, nodeTypes);

  // :: nodes -> [ nodeOriginalId, nodeNewId ]
  const guidToIdx = R.compose(
    R.fromPairs,
    mapIndexed((id, idx) => [id, idx]),
    R.keys
  );

  // :: nodeIdMap, links -> linksWithResolvedNodeIds
  const resolveLinkIds = R.curry((nodeIdMap, links) =>
    R.compose(
      R.map(
        R.evolve({
          pins: R.map(pin =>
            R.compose(
              R.assoc('nodeId', R.prop(pin.nodeId, nodeIdMap)),
              R.assoc('pinKey', R.propOr(pin.pinKey, pin.pinKey, nodeIdMap))
            )(pin)
          ),
        })
      ),
      R.values
    )(links)
  );

  // :: nodeIdMap, nodes -> nodesWithNewIds
  const resolveNodeIds = R.curry((nodeIdMap, nodes) =>
    R.compose(
      R.map(node => R.assoc('id', nodeIdMap[node.id], node)),
      R.values
    )(nodes)
  );

  // :: patches -> nodeIdMapsInsidePatches
  const nodeIdMapsInsidePatches = R.compose(
    R.reduce((acc, patch) =>
      R.assoc(
        patch.id,
        R.compose(
          R.fromPairs,
          R.map(node => [node.id, `${patch.id}/${node.id}`]),
          R.values,
          R.prop('nodes')
        )(patch),
        acc
      ),
      {}
    ),
    R.values
  );

  // :: { patchId: nodeIdMap } -> patches -> patchesWithResolvedIds
  const resolveIdsInPatches = R.curry((nodeIdsMap, patches) =>
    R.compose(
      indexById,
      R.map(patch =>
        R.evolve({
          nodes: R.compose(
            indexById,
            resolveNodeIds(nodeIdsMap[patch.id])
          ),
          links: R.compose(
            indexById,
            resolveLinkIds(
              R.compose(
                R.mergeAll,
                R.values
              )(nodeIdsMap)
            )
          ),
        })(patch)
      ),
      R.values
    )(patches)
  );

  // // patches -> patchesWithResolvedIds
  const extendAllIdsWithPatchId = patches => R.compose(
    resolveIdsInPatches,
    nodeIdMapsInsidePatches
  )(patches)(patches);

  const allPatches = R.compose(
    extendAllIdsWithPatchId,
    R.propOr({}, 'patches')
  )(project);

  // flat patch that merged from all non-patchnodes
  const mergedPatch = R.compose(
    R.omit(['id', 'label']),
    R.reduce(R.mergeWith(R.merge), {}),
    R.reject(isPatchNodeType),
    R.values
  )(allPatches);

  // :: String -> {a} -- extacts a specific key branch from the merged patch
  const mergedEntities = key => R.propOr({}, key)(mergedPatch);

  // type PatchNode = {nodes :: [Node], links :: [Link]}

  // :: {patchNode.label: PatchNode}
  const patchNodesByName = R.compose(
    R.map(R.omit(['label'])),
    R.indexBy(R.prop('label')),
    R.map(
      R.compose(
        R.evolve({ links: R.values, nodes: R.values }),
        R.pickAll(['label', 'links', 'nodes'])
      )
    ),
    R.filter(isPatchNodeType),
    R.values
  )(allPatches);

  // :: Node -> Boolean
  // "true", if node is instance of one of @patchNodesByName
  // and its .typeId is not in @nodeTypes
  const isPatchNodeInstance = R.compose(
    R.both(
      R.complement(R.has(R.__, nodeTypes)),
      R.compose(
        R.any(R.__, R.keys(patchNodesByName)),
        type => label => RegExp(`/${label}$`).test(type)
      )
    ),
    R.propOr('', 'typeId')
  );

  let allNodes = mergedEntities('nodes');
  let allLinks = mergedEntities('links');

  // performs one iteration of patchnode injection
  function populate() {
    const patchNodeInstId = R.compose(
      R.head,
      R.pluck('id'),
      R.filter(isPatchNodeInstance),
      R.values
    )(allNodes);

    if (!patchNodeInstId) {
      // there is no more patch-nodes to populate -> work is done
      return true;
    }

    const patchNodeInstInputLinks = R.pickBy(
      ({ pins: [_, { nodeId }] }) => nodeId === patchNodeInstId,
      allLinks
    );
    const patchNodeInstOutputLinks = R.pickBy(
      ({ pins: [{ nodeId }, _] }) => nodeId === patchNodeInstId,
      allLinks
    );

    const linksToPins = R.compose(R.pluck('pins'), R.values);
    const patchNodeInstInputPins = linksToPins(patchNodeInstInputLinks);
    const patchNodeInstOutputPins = linksToPins(patchNodeInstOutputLinks);

    const cleanedLinks = R.omit(
      R.concat(R.keys(patchNodeInstInputLinks), R.keys(patchNodeInstOutputLinks)),
      allLinks
    );

    const cleanedNodes = R.dissoc(patchNodeInstId.toString(), allNodes);

    let newNodes = {};
    let newLinks = {};
    R.values(cleanedNodes).forEach((n) => { newNodes = R.assoc(n.id.toString(), n, newNodes); });
    R.values(cleanedLinks).forEach((l) => { newLinks = R.assoc(l.id.toString(), l, newLinks); });

    const { nodes, links } = R.compose(
      R.prop(R.__, patchNodesByName),
      R.last, R.split('/'),
      R.prop('typeId'),
      R.prop(R.__, allNodes)
    )(patchNodeInstId);

    // push nodes
    let oldToNewId = {};
    nodes.forEach((node) => {
      const newId = generateId();
      oldToNewId = R.assoc(node.id, newId, oldToNewId);
      newNodes = R.assoc(
        newId,
        R.assoc('id', newId, node),
        newNodes
      );
    });

    // push internal links
    links.forEach((link) => {
      const newLinkId = generateId();

      const {
        pins: [
          { nodeId: nFrom, pinKey: pFrom },
          { nodeId: nTo, pinKey: pTo },
        ],
      } = link;

      const newLink = {
        id: newLinkId,
        pins: [
          { pinKey: pFrom, nodeId: oldToNewId[nFrom] },
          { pinKey: pTo, nodeId: oldToNewId[nTo] },
        ],
      };

      newLinks = R.assoc(newLinkId, newLink, newLinks);
    });

    // relink patchnode inputs
    R.filter(
      ([_, { nodeId }]) => nodeId === patchNodeInstId,
      patchNodeInstInputPins
    ).forEach(
      ([source, { pinKey: terminal }]) => {
        const newLinkId = generateId();

        const terminalId = R.last(R.split('_', terminal));

        const newLink = {
          id: newLinkId,
          pins: [
            source,
            { pinKey: 'PIN', nodeId: oldToNewId[terminalId] },
          ],
        };

        newLinks = R.assoc(newLinkId, newLink, newLinks);
      }
    );

    // relink patchnode outputs
    R.filter(
      ([{ nodeId }, _]) => nodeId === patchNodeInstId,
      patchNodeInstOutputPins
    ).forEach(
      ([{ pinKey: terminal }, target]) => {
        const newLinkId = generateId();

        const terminalId = R.last(R.split('_', terminal));
        const newLink = {
          id: newLinkId,
          pins: [
            { pinKey: 'PIN', nodeId: oldToNewId[terminalId] },
            target,
          ],
        };

        newLinks = R.assoc(newLinkId, newLink, newLinks);
      }
    );

    allNodes = newNodes;
    allLinks = newLinks;
    return false;
  }

  while (!populate()) {
    // populate recursively
  }

  const isPinsEmpty = R.compose(
    R.isEmpty,
    R.prop('pins')
  );

  // insert contant nodes for the pinned inputs
  const nodesWithPinnedInputs = R.compose(
    R.filter(
      R.compose(
        R.any(R.propEq('injected', true)),
        R.values,
        R.prop('pins')
      )
    ),
    R.reject(isPinsEmpty),
    R.values
  )(allNodes);

  nodesWithPinnedInputs.forEach(({ id, pins }) => {
    R.toPairs(pins).forEach(([pinKey, { value }]) => {
      const newNodeId = generateId();
      const newLinkId = generateId();

      const newNode = {
        id: newNodeId,
        properties: { value },
        typeId: '<<const>>',
      };
      const newLink = {
        id: newLinkId,
        pins: [
          { pinKey: 'value', nodeId: newNodeId },
          { pinKey, nodeId: id },
        ],
      };

      allNodes = R.assoc(newNodeId, newNode, allNodes);
      allLinks = R.assoc(newLinkId, newLink, allLinks);
    });
  });

  // calculate the mapping "GUID -> Int index"
  const nodeGuidToIdx = guidToIdx(allNodes);
  const nodeList = resolveNodeIds(nodeGuidToIdx, allNodes);
  const linkList = resolveLinkIds(nodeGuidToIdx, allLinks);

  const usedNodeTypeIds = R.pluck('typeId', nodeList);
  const usedNodeTypes = R.pick(usedNodeTypeIds, nodeTypes);

  // :: Node -> NodeType
  const nodeTypeByNode = R.compose(nodeTypeByKey, R.prop('typeId'));

  // :: NodeType -> {Key: NodeType.Pin}
  const nodeTypePins = R.propOr({}, 'pins');

  // :: String -> JSType -- converts pin string type name to native JS type object
  const nativeType = R.cond([
    [R.equals(PIN_TYPE.PULSE), R.always('<<identity>>')],
    [R.equals(PIN_TYPE.BOOL), R.always(Boolean)],
    [R.equals(PIN_TYPE.NUMBER), R.always(Number)],
    [R.equals(PIN_TYPE.STRING), R.always(String)],
    [R.T, () => { throw Error('Unknown type!'); }],
  ]);

  // :: {Key: NodeType.Pin} -> {Key: NodeType.Pin}
  const filterByDirection = R.compose(R.filter, R.propEq('direction'));

  // :: NodeType -> {Key: NodeType.Pin}
  const inputs = R.compose(filterByDirection(PIN_DIRECTION.INPUT), nodeTypePins);

  // :: NodeType -> {Key: (value -> JSType)}
  const inputTypes = R.compose(
    R.map(R.compose(nativeType, R.prop('type'))),
    inputs
  );

  // :: NodeType -> TransformedNodeType
  const transformedNodeType = nodeType => R.merge(
    R.pick(['pure'], nodeType),
    R.objOf(
      'inputTypes',
      isInputNode(nodeType, 'key')
        ? { PIN: nativeType(nodeType.pins.PIN.type) }
        : inputTypes(nodeType)
    )
  );

  // :: Node -> [Link]
  const outgoingLinks = node => R.filter(
    R.compose(
      R.propEq('nodeId', node.id),
      R.nth(0),
      R.prop('pins')
    )
  )(linkList);

  // :: Node -> {outKey: [Link]}
  const nodeOutLinks = R.compose(
    R.reduce(
      (outLinks, link) => {
        const [fromNode, toNode] = link.pins;

        return R.mergeWith(
          R.concat,
          {
            [fromNode.pinKey]: [{
              key: toNode.pinKey,
              nodeId: toNode.nodeId,
            }],
          },
          outLinks
        );
      },
      {}
    ),
    outgoingLinks
  );

  // :: Node -> TransformedNode
  const transformedNode = R.compose(
    R.mergeAll,
    R.juxt([
      R.compose(
        renameKeys({ typeId: 'implId', properties: 'props' }),
        R.dissocPath(['properties', 'label']),
        R.pick(['id', 'typeId', 'properties'])
      ),
      R.compose(transformedNodeType, nodeTypeByNode),
      R.compose(R.objOf('outLinks'), nodeOutLinks),
    ])
  );

  const transformedNodes = R.fromPairs(
    R.map(
      R.compose(
        n => [n.id, n],
        transformedNode
      ),
      nodeList
    )
  );

  // :: NodeType -> ImplementationString
  const nodeTypeImpl = R.compose(
    priorityValue(implPlatforms),
    R.propOr({}, 'impl')
  );

  const impl = R.map(nodeTypeImpl, usedNodeTypes);

  // Link -> [NodeId]
  const linkNodeIds = R.compose(
    R.pluck('nodeId'),
    R.prop('pins')
  );

  const dagVertexes = R.pluck('id', nodeList);
  const dagEdges = R.map(linkNodeIds, linkList);
  const topology = sortGraph(dagVertexes, dagEdges);

  return {
    nodes: transformedNodes,
    impl,
    topology,
  };
}
