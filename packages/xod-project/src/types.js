
import R from 'ramda';
import $ from 'sanctuary-def';
import HMDef from 'hm-def';

import { env as $env, createTypeUtils } from 'xod-func-tools';

import * as C from './constants';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

//-----------------------------------------------------------------------------
//
// Type utilities
//
//-----------------------------------------------------------------------------

const {
  NullaryType,
  EnumType,
  Model,
  OneOfType,
  AliasType,
  hasType,
} = createTypeUtils(
  'xod-project',
  'http://xod.io/docs/dev/xod-project/#'
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
  path: PatchPath,
});

export const Project = Model('Project', {
  patches: $.StrMap(Patch),
  name: $.String,
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

export const env = $env.concat([
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
