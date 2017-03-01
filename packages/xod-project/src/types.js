
import R from 'ramda';
import RF from 'ramda-fantasy';
import $ from 'sanctuary-def';
import HMDef from 'hm-def';
import * as C from './constants';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

//-----------------------------------------------------------------------------
//
// Type utilities
//
//-----------------------------------------------------------------------------

// :: String -> String
const qualifiedTypeName = typeName => `xod-project/${typeName}`;

// :: String -> String
const typeUrl = typeName => `http://xod.io/docs/dev/xod-project/#${typeName}`;

// :: (String, Any -> Boolean) -> Type
const NullaryType = (typeName, predicate) => $.NullaryType(
  qualifiedTypeName(typeName),
  typeUrl(typeName),
  predicate
);

// :: (String, [Any]) -> Type
const EnumType = (typeName, values) => $.EnumType(
  qualifiedTypeName(typeName),
  typeUrl(typeName),
  values
);

// :: Type -> Any -> Boolean
// To keep checking fast we have to call private method of $.Type
// eslint-disable-next-line no-underscore-dangle
const hasType = type => x => type._test(x);

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

export const $Maybe = $.UnaryType(
  'ramda-fantasy/Maybe',
  'https://github.com/ramda/ramda-fantasy/blob/master/docs/Maybe.md',
  R.is(RF.Maybe),
  maybe => (maybe.isJust ? [maybe.value] : [])
);

export const $Either = $.BinaryType(
  'ramda-fantasy/Either',
  'https://github.com/ramda/ramda-fantasy/blob/master/docs/Either.md',
  R.is(RF.Either),
  either => (either.isLeft ? [either.value] : []),
  either => (either.isRight ? [either.value] : [])
);

//-----------------------------------------------------------------------------
//
// Cheking utilities
//
//-----------------------------------------------------------------------------

const dataTypes = R.values(C.PIN_TYPE);

const terminalPatchPathRegExp =
  new RegExp(`^xod/core/(input|output)(${dataTypes.join('|')})$`, 'i');

const matchesTerminalPatchPath = R.test(terminalPatchPathRegExp);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------

const ObjectWithId = NullaryType('ObjectWithId', R.has('id'));
const ObjectWithKey = NullaryType('ObjectWithKey', R.has('key'));

export const Label = AliasType('Label', $.String);
export const Source = AliasType('Source', $.String);
export const ShortId = AliasType('ShortId', $.String);
export const LinkId = AliasType('LinkId', ShortId);
export const NodeId = AliasType('NodeId', ShortId);
export const PinKey = AliasType('PinKey', $.String);
export const PatchPath = AliasType('PatchPath', $.String);
export const PinDirection = EnumType('PinDirection', R.values(C.PIN_DIRECTION));
export const DataType = EnumType('DataType', R.values(C.PIN_TYPE));
export const DataValue = NullaryType('DataValue', R.complement(R.isNil));

export const Pin = Model('Pin', {
  key: PinKey,
  direction: PinDirection,
  label: $.String,
  type: DataType,
  value: DataValue,
  order: $.Number,
  description: $.String,
});

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
});

export const Project = Model('Project', {
  patches: $.StrMap(Patch),
  authors: $.Array($.String),
  license: $.String,
  description: $.String,
});

export const TerminalNode = NullaryType(
  'TerminalNode',
  R.both(
    hasType(Node),
    R.propSatisfies(matchesTerminalPatchPath, 'type')
  )
);

export const NodeOrId = OneOfType('NodeOrId', [NodeId, ObjectWithId]);
export const LinkOrId = OneOfType('LinkOrId', [LinkId, ObjectWithId]);
export const PinOrKey = OneOfType('PinOrKey', [PinKey, ObjectWithKey]);

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------

export const env = $.env.concat([
  $Either,
  $Maybe,
  Link,
  LinkId,
  LinkOrId,
  Node,
  NodeId,
  NodeOrId,
  NodePosition,
  TerminalNode,
  Patch,
  PatchPath,
  Pin,
  PinOrKey,
  PinKey,
  PinRef,
  PinDirection,
  DataType,
  DataValue,
  Project,
  ShortId,
  Label,
  Source,
]);

export const def = HMDef.create({ checkTypes: true, env });
