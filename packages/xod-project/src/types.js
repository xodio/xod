import HMDef from 'hm-def';
import * as R from 'ramda';
import $ from 'sanctuary-def';

import * as XF from 'xod-func-tools';

import * as C from './constants';
import { isTerminalPatchPath, isProjectNameValid, isValidIdentifier, isValidPatchPath, isLibName } from './internal/patchPathUtils';
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
const NonZeroNaturalNumber = NullaryType(
  'NonZeroNaturalNumber',
  R.both(Number.isInteger, R.gt(R.__, 0))
);

export const Label = AliasType('Label', $.String);
export const Source = AliasType('Source', $.String);
export const ShortId = AliasType('ShortId', $.String);
export const LinkId = AliasType('LinkId', ShortId);
export const NodeId = AliasType('NodeId', ShortId);
export const ArityLevel = AliasType('ArityLevel', NonZeroNaturalNumber);
export const CommentId = AliasType('CommentId', ShortId);
export const PinKey = AliasType('PinKey', NodeId);
export const PinLabel = AliasType('PinLabel', $.String);
export const Identifier = NullaryType('Identifier', isValidIdentifier);
export const ProjectName = NullaryType('ProjectName', isProjectNameValid);
export const PatchPath = NullaryType('PatchPath', isValidPatchPath);
export const LibName = NullaryType('LibName', isLibName);
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

export const Position = Model('Position', {
  x: $.Number,
  y: $.Number,
});

export const PinRef = Model('PinRef', {
  nodeId: NodeId,
  pinKey: PinKey,
});

export const Node = Model('Node', {
  id: NodeId,
  position: Position,
  type: PatchPath,
  label: $.String,
  description: $.String,
  boundValues: $.StrMap(DataValue),
  arityLevel: ArityLevel,
});

export const Link = Model('Link', {
  id: LinkId,
  input: PinRef,
  output: PinRef,
});

export const Attachment = Model('Attachment', {
  filename: $.String,
  encoding: $.String,
  content: $.String,
});

export const Size = Model('Size', {
  width: $.Number,
  height: $.Number,
});

export const Comment = Model('Comment', {
  id: CommentId,
  position: Position,
  size: Size,
  content: $.String,
});

export const Patch = Model('Patch', {
  nodes: $.StrMap(Node),
  links: $.StrMap(Link),
  comments: $.StrMap(Comment),
  path: PatchPath,
  description: $.String,
  attachments: $.Array(Attachment),
});

export const Project = Model('Project', {
  patches: $.StrMap(Patch),
  name: ProjectName,
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
  Attachment,
  Comment,
  CommentId,
  DataType,
  DataValue,
  Identifier,
  ProjectName,
  Label,
  Link,
  LinkId,
  LinkOrId,
  Node,
  NodeId,
  NodeOrId,
  Patch,
  PatchPath,
  Pin,
  PinDirection,
  PinKey,
  PinLabel,
  PinOrKey,
  PinRef,
  Position,
  Project,
  ShortId,
  Size,
  Source,
  TerminalNode,
  Version,
  LibName,
  ArityLevel,
  NonZeroNaturalNumber,
]);

export const def = HMDef.create({
  checkTypes: !!process.env.XOD_HM_DEF,
  env,
});
