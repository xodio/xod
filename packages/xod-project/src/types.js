
import R from 'ramda';
import $ from 'sanctuary-def';
import HMDef from 'hm-def';
import type from 'sanctuary-type-identifiers';

//=============================================================================
//
// Type utilities
//
//=============================================================================
const NullaryType = (typeName, predicate) => $.NullaryType(
  `xod-project/${typeName}`,
  `http://xod.io/docs/dev/xod-project/#${typeName}`,
  predicate
);

// :: Type -> (Any -> Boolean)
const hasType = $.test([]);

// :: [Type] -> (Any -> Boolean)
const hasOneOfType = types => R.anyPass(
  R.map(hasType, types)
);

const Model = (typeName, schema) => NullaryType(
  typeName,
  hasType($.RecordType(schema))
)

const OneOfType = (typeName, types) => NullaryType(
  typeName,
  hasOneOfType(types)
);

//=============================================================================
//
// Domain types
//
//=============================================================================

const ObjectWithId = NullaryType('ObjectWithId', R.has('id'));

export const ShortId = $.String;
export const LinkId = ShortId;
export const NodeId = ShortId;
export const PinKey = $.String;
export const PatchPath = $.String;

export const NodePosition = $.RecordType({
  x: $.Number,
  y: $.Number,
});

export const PinRef = $.RecordType({
  nodeId: NodeId,
  pinKey: PinKey,
});

export const Node = Model('Node', {
  id: NodeId,
  position: NodePosition,
  type: PatchPath,
});

export const Link = Model('Link', {
  id: LinkId,
  input: PinRef,
  output: PinRef,
});

export const NodeOrId = OneOfType('NodeOrId', [NodeId, ObjectWithId])
export const LinkOrId = OneOfType('LinkOrId', [LinkId, ObjectWithId]);

//=============================================================================
//
// Environment
//
//=============================================================================
const env = $.env.concat([
  Link,
  PinRef,
  PinKey,
  NodeId,
  LinkId,
  ShortId,
]);

export const def = HMDef.create({ checkTypes: true, env });
