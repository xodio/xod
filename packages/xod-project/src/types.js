import HMDef from 'hm-def';
import R from 'ramda';
import $ from 'sanctuary-def';

import XF from 'xod-func-tools';

import * as C from './constants';
import { isTerminalPatchPath, isValidIdentifier, isValidPatchPath } from './internal/patchPathUtils';
import { isValidVersion } from './versionUtils';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

const packageName = 'xod-project';
const docUrl = 'http://xod.io/docs/dev/xod-project/#';

//-----------------------------------------------------------------------------
//
// Type utilities
//
//-----------------------------------------------------------------------------

const NullaryType = XF.NullaryType(packageName, docUrl);
const AliasType = XF.AliasType(packageName, docUrl);
const EnumType = XF.EnumType(packageName, docUrl);
const Model = XF.Model(packageName, docUrl);
const OneOfType = XF.OneOfType(packageName, docUrl);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------

const ObjectWithId = NullaryType('ObjectWithId', R.both(XF.notNil, R.has('id')));
const ObjectWithKey = NullaryType('ObjectWithKey', R.both(XF.notNil, R.has('key')));

export const Label = AliasType('Label', $.String);
export const Source = AliasType('Source', $.String);
export const ShortId = AliasType('ShortId', $.String);
export const LinkId = AliasType('LinkId', ShortId);
export const NodeId = AliasType('NodeId', ShortId);
export const PinKey = AliasType('PinKey', NodeId);
export const PinLabel = AliasType('PinLabel', $.String);
export const Identifier = NullaryType('Identifier', isValidIdentifier);
export const PatchPath = NullaryType('PatchPath', isValidPatchPath);
export const PinDirection = EnumType('PinDirection', R.values(C.PIN_DIRECTION));
export const DataType = EnumType('DataType', R.values(C.PIN_TYPE));
export const DataValue = NullaryType('DataValue', XF.notNil);
export const Version = NullaryType('Version', isValidVersion);

export const Pin = Model('Pin', {
  key: PinKey,
  direction: PinDirection,
  label: PinLabel,
  type: DataType,
  defaultValue: DataValue,
  order: $.Number,
  description: $.String,
  isBindable: $.Boolean,
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
  label: $.String,
  description: $.String,
  boundValues: $.StrMap(DataValue),
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
  path: PatchPath,
  description: $.String,
});

export const Project = Model('Project', {
  patches: $.StrMap(Patch),
  name: Identifier,
  authors: $.Array($.String),
  license: $.String,
  version: Version,
  description: $.String,
});

export const TerminalNode = NullaryType(
  'TerminalNode',
  R.both(
    XF.hasType(Node),
    R.propSatisfies(isTerminalPatchPath, 'type')
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

export const env = XF.env.concat([
  Identifier,
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
  PinLabel,
  PinRef,
  PinDirection,
  DataType,
  DataValue,
  Project,
  ShortId,
  Label,
  Source,
  Version,
]);

export const def = HMDef.create({
  checkTypes: !!process.env.XOD_HM_DEF,
  env,
});
