
import R from 'ramda';
import $ from 'sanctuary-def';
import HMDef from 'hm-def';

import XF from 'xod-func-tools';

import * as C from './constants';

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
// Cheking utilities
//
//-----------------------------------------------------------------------------

const dataTypes = R.values(C.PIN_TYPE);

const notNil = R.complement(R.isNil);

const terminalPatchPathRegExp =
  new RegExp(`^xod/core/(input|output)-(${dataTypes.join('|')})$`, 'i');

const matchesTerminalPatchPath = R.test(terminalPatchPathRegExp);

// :: String -> Boolean
const isValidIdentifier = R.allPass([
  R.test(/[a-z0-9-]+/), // only lowercase alphanumeric and hypen
  R.complement(R.test(/^-/)), // can't start with hypen
  R.complement(R.test(/-$/)), // can't end with hypen
  R.complement(R.test(/--/)), // only one hypen in row
]);

// :: String -> Boolean
const isValidPatchPath = R.both(
  R.is(String),
  R.pipe(
    R.split('/'),
    R.either(
      R.allPass([ // local path
        R.pipe(R.length, R.equals(2)),
        R.pipe(R.head, R.equals('@')),
        R.pipe(R.last, isValidIdentifier),
      ]),
      R.allPass([ // library path
        R.pipe(R.length, R.equals(3)),
        R.all(isValidIdentifier),
      ])
    )
  )
);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------

const ObjectWithId = NullaryType('ObjectWithId', R.both(notNil, R.has('id')));
const ObjectWithKey = NullaryType('ObjectWithKey', R.both(notNil, R.has('key')));

export const Label = AliasType('Label', $.String);
export const Source = AliasType('Source', $.String);
export const ShortId = AliasType('ShortId', $.String);
export const LinkId = AliasType('LinkId', ShortId);
export const NodeId = AliasType('NodeId', ShortId);
export const PinKey = AliasType('PinKey', $.String);
export const Identifier = NullaryType('Identifier', isValidIdentifier);
export const PatchPath = NullaryType('PatchPath', isValidPatchPath);
export const PinDirection = EnumType('PinDirection', R.values(C.PIN_DIRECTION));
export const DataType = EnumType('DataType', R.values(C.PIN_TYPE));
export const DataValue = NullaryType('DataValue', notNil);

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
  name: Identifier,
  authors: $.Array($.String),
  license: $.String,
  description: $.String,
});

export const TerminalNode = NullaryType(
  'TerminalNode',
  R.both(
    XF.hasType(Node),
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

export const env = XF.env.concat([
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

export const def = HMDef.create({
  checkTypes: process.env.NODE_ENV !== 'production',
  env,
});
