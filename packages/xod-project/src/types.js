
import R from 'ramda';
import RF from 'ramda-fantasy';
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
// Fantasy land types
//
//-----------------------------------------------------------------------------

export const $Either = $.BinaryType(
  'ramda-fantasy/Either',
  'https://github.com/ramda/ramda-fantasy/blob/master/docs/Either.md',
  R.is(RF.Either),
  either => either.isLeft ? [either.value] : [],
  either => either.isRight ? [either.value] : []
);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------

const ObjectWithId = NullaryType('ObjectWithId', R.has('id'));

export const Label = AliasType('Label', $.String);
export const Source = AliasType('Source', $.String);
export const ShortId = AliasType('ShortId', $.String);
export const LinkId = AliasType('LinkId', ShortId);
export const NodeId = AliasType('NodeId', ShortId);
export const PinKey = AliasType('PinKey', $.String);
export const PatchPath = AliasType('PatchPath', $.String);
export const Pin = AliasType('Pin', $.Object); // TODO: enforce model

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

export const Patch = Model('Patch', {
  nodes: $.StrMap(Node),
  links: $.StrMap(Link),
  impls: $.StrMap(Source),
  pins: $.StrMap(Pin),
  //label: Label,
});

export const NodeOrId = OneOfType('NodeOrId', [NodeId, ObjectWithId]);
export const LinkOrId = OneOfType('LinkOrId', [LinkId, ObjectWithId]);

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------

export const env = $.env.concat([
  $Either,
  Link,
  LinkId,
  LinkOrId,
  NodeId,
  NodeOrId,
  Patch,
  PinKey,
  PinRef,
  ShortId,
]);

export const def = HMDef.create({ checkTypes: true, env });
