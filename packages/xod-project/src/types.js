
import R from 'ramda';
import $ from 'sanctuary-def';
import HMDef from 'hm-def';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

//-----------------------------------------------------------------------------
//
// Type utilities
//
//-----------------------------------------------------------------------------

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
);

const OneOfType = (typeName, types) => NullaryType(
  typeName,
  hasOneOfType(types)
);

const AliasType = (typeName, type) => NullaryType(
  typeName,
  hasType(type)
);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------

const ObjectWithId = NullaryType('ObjectWithId', R.has('id'));

export const ShortId = AliasType('ShortId', $.String);
export const LinkId = AliasType('LinkId', ShortId);
export const NodeId = AliasType('NodeId', ShortId);
export const PinKey = AliasType('PinKey', $.String);
export const PatchPath = AliasType('PatchPath', $.String);

export const NodePosition = Model('NodePosition', {
  x: $.Number,
  y: $.Number,
});

export const PinRef = Model('PinRef', {
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

export const NodeOrId = OneOfType('NodeOrId', [NodeId, ObjectWithId]);
export const LinkOrId = OneOfType('LinkOrId', [LinkId, ObjectWithId]);

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------
export const env = $.env.concat([
  Link,
  PinRef,
  PinKey,
  NodeId,
  LinkId,
  ShortId,
  NodeOrId,
  LinkOrId,
]);

export const def = HMDef.create({ checkTypes: true, env });
