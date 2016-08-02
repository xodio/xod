
import R from 'ramda';

/**
  * Transforms JSON data as it seen it *.xod files to
  * a shape expected by the runtime.
  */
export function transform(project) {
  // :: pin string type name -> JS type object
  const mapType = R.pipe(
    R.when(R.equals('pulse'), R.always(Boolean)),
    R.when(R.equals('bool'), R.always(Boolean)),
    R.when(R.equals('number'), R.always(Number)),
    R.when(R.equals('string'), R.always(String))
  );

  // :: Node -> NodeType
  const nodeTypeOf = node => project.nodeTypes[node.typeId] || {};

  // :: NodeType -> Pin map containing only inputs
  const inputPinsOf = nodeType => R.filter(R.propEq('direction', 'input'))(nodeType.pins);

  // :: NodeType -> inputTypes branch
  const inputTypesOf = nodeType => R.compose(
    R.map(pin => mapType(pin.type)),
    inputPinsOf
  )(nodeType);

  // :: NodeType -> flat NodeType
  const transformNodeType = nodeType => R.merge(
    R.pick(['pure', 'setup', 'evaluate'])(nodeType),
    {
      inputTypes: inputTypesOf(nodeType),
    }
  );

  // :: Node -> flat Node
  const transformNode = node => R.mergeAll([
    R.pick(['id'])(node),
    R.compose(transformNodeType, nodeTypeOf)(node),
    {
      outLinks: {},
    }
  ]);

  return R.map(transformNode, project.nodes || {});
}
