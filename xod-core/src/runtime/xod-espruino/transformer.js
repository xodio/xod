
import R from 'ramda';
import { sortGraph } from '../utils/gmath';
import { PIN_DIRECTION, PIN_TYPE } from 'xod-core/project/constants';

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

/**
  * Transforms JSON data as it seen it *.xod files to
  * a shape expected by the runtime.
  *
  * @param {Object} project -- project from app world
  * @param {Array.<String>} implPlatforms -- allowed platforms to extract
  *   implementation for given in prioritized list. E.g. ['espruino', 'js'].
  */
export default function transform(project, implPlatforms = []) {
  // :: () -> Patch -- joins all patches into one shallow
  const mergedPatch = R.compose(
    R.omit('id'),
    R.reduce(R.mergeWith(R.merge), {}),
    R.values,
    R.propOr({}, 'patches')
  )(project);

  // :: String -> {a} -- extacts a specific key branch from the merged patch
  const mergedEntities = key => R.propOr({}, key)(mergedPatch);

  const nodes = () => mergedEntities('nodes');
  const nodeList = R.compose(R.values, nodes);

  const links = () => mergedEntities('links');
  const linkList = R.compose(R.values, links);

  const nodeTypes = () => R.propOr({}, 'nodeTypes', project);
  const nodeTypeByKey = key => R.propOr({}, key, nodeTypes());

  const usedNodeTypeIds = () => R.pluck('typeId', R.values(nodes()));
  const usedNodeTypes = () => R.pick(usedNodeTypeIds(), nodeTypes());

  // :: Node -> NodeType
  const nodeTypeByNode = R.compose(nodeTypeByKey, R.prop('typeId'));

  // :: NodeType -> {Key: NodeType.Pin}
  const nodeTypePins = R.propOr({}, 'pins');

  // :: String -> JSType -- converts pin string type name to native JS type object
  const nativeType = R.pipe(
    R.when(R.equals(PIN_TYPE.PULSE), R.always(Boolean)),
    R.when(R.equals(PIN_TYPE.BOOL), R.always(Boolean)),
    R.when(R.equals(PIN_TYPE.NUMBER), R.always(Number)),
    R.when(R.equals(PIN_TYPE.STRING), R.always(String))
  );

  // :: {Key: NodeType.Pin} -> {Key: NodeType.Pin}
  const filterByDirection = dir => R.filter(R.propEq('direction', dir));

  // :: NodeType -> {Key: NodeType.Pin}
  const inputs = R.compose(filterByDirection(PIN_DIRECTION.INPUT), nodeTypePins);

  // :: NodeType -> {Key: JSType}
  const inputTypes = R.compose(
    R.map(pin => nativeType(pin.type)),
    inputs
  );

  // :: NodeType -> TransformedNodeType
  const transformedNodeType = nodeType => R.merge(
    R.pick(['pure'])(nodeType),
    R.objOf('inputTypes', inputTypes(nodeType))
  );

  // :: Node -> [Link]
  const outgoingLinks = (node) => R.filter(
    R.compose(
      R.propEq('nodeId', node.id),
      R.nth(0),
      R.prop('pins')
    )
  )(linkList());

  // :: Node -> {outKey: [Link]}
  const nodeOutLinks = node => R.reduce(
    (outLinks, pin) => {
      const key = pin.pins[0].pinKey;
      const newLink = {
        key: pin.pins[1].pinKey,
        nodeId: pin.pins[1].nodeId,
      };

      if (R.has(key, outLinks)) {
        return R.append(newLink, outLinks[key]);
      }

      return R.assoc(key, [newLink], outLinks);
    },
    {},
    outgoingLinks(node)
  );

  // :: Node -> TransformedNode
  const transformedNode = node => R.mergeAll([
    renameKeys(
      { typeId: 'implId', properties: 'props' },
      R.pick(['id', 'typeId', 'properties'])(node)
    ),
    R.compose(transformedNodeType, nodeTypeByNode)(node),
    R.objOf('outLinks', nodeOutLinks(node)),
  ]);

  const transformedNodes = R.map(transformedNode, nodes());

  // :: NodeType -> ImplementationString
  const nodeTypeImpl = R.compose(
    priorityValue(implPlatforms),
    R.propOr({}, 'impl')
  );

  const impl = R.map(nodeTypeImpl, usedNodeTypes());

  // Link -> [NodeId]
  const linkNodeIds = R.compose(
    R.pluck('nodeId'),
    R.prop('pins')
  );

  const dagVertexes = R.pluck('id', nodeList());
  const dagEdges = R.map(linkNodeIds, linkList());
  const topology = sortGraph(dagVertexes, dagEdges);

  return {
    nodes: transformedNodes,
    impl,
    topology,
  };
}
