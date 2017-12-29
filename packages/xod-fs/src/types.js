import * as R from 'ramda';
import $ from 'sanctuary-def';
import HMDef from 'hm-def';
import {
  Identifier,
  PatchPath,
  Patch,
  Node,
  Link,
  Comment,
  env as xpEnv,
} from 'xod-project';
import * as XF from 'xod-func-tools';

import { CHANGE_TYPES } from './constants';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

const packageName = 'xod-fs';
const docUrl = 'http://xod.io/docs/dev/xod-fs/#';

//-----------------------------------------------------------------------------
//
// Type utilities
//
//-----------------------------------------------------------------------------

const Model = XF.Model(packageName, docUrl);
const AliasType = XF.AliasType(packageName, docUrl);
const NullaryType = XF.NullaryType(packageName, docUrl);
const UnaryType = XF.UnaryType(packageName, docUrl);
const OneOfType = XF.OneOfType(packageName, docUrl);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------

export const $Buffer = NullaryType('Buffer', R.is(Buffer));
export const Path = NullaryType('Path', R.both(XF.hasType($.String), XF.notEmpty));

// :: x -> Boolean
const isValidXodFile = R.allPass([
  R.complement(R.isNil),
  R.has('path'),
  R.has('content'),
  R.compose(
    XF.hasType(Path),
    R.prop('path')
  ),
]);

export const XodFile = UnaryType('XodFile',
  isValidXodFile,
  R.compose(
    R.of,
    R.prop('content')
  )
);

export const PatchFileContents = Model('PatchFileContents', {
  nodes: $.Array(Node),
  links: $.Array(Link),
  comments: $.Array(Comment),
  description: $.String,
});

export const PatchFile = AliasType('PatchFile', XodFile(PatchFileContents));

export const ProjectFileContents = Model('ProjectFileContents', {
  name: Identifier,
  authors: $.Array($.String),
  license: $.String,
  description: $.String,
  version: $.String,
});

export const ProjectFile = AliasType('ProjectFile', XodFile(ProjectFileContents));
export const AttachmentFile = AliasType('AttachmentFile', XodFile($.String));

// TODO: Remove last `XodFile(Patch)` after refactoring of loadProject* and readXodFile functions
export const AnyXodFile = OneOfType('AnyXodFile', [ProjectFile, PatchFile, AttachmentFile, XodFile(Patch)]);

export const XodFileContent = OneOfType('XodFileContent', [ProjectFileContents, PatchFileContents, Patch, $.String]);

export const AddedChangeType = NullaryType('AddedChangeType', R.equals(CHANGE_TYPES.ADDED));
export const ModifiedChangeType = NullaryType('ModifiedChangeType', R.equals(CHANGE_TYPES.MODIFIED));
export const DeletedChangeType = NullaryType('DeletedChangeType', R.equals(CHANGE_TYPES.DELETED));
export const AnyChangeType = OneOfType('AnyChangeType', [AddedChangeType, ModifiedChangeType, DeletedChangeType]);
//
export const AddedPatchChange = Model('AddedPatchChange', {
  path: PatchPath,
  changeType: AddedChangeType,
  data: Patch,
});
export const ModifiedPatchChange = Model('ModifiedPatchChange', {
  path: PatchPath,
  changeType: ModifiedChangeType,
  data: Patch,
});
export const DeletedPatchChange = Model('DeletedPatchChange', {
  path: PatchPath,
  changeType: DeletedChangeType,
});
export const AnyPatchChange = OneOfType('AnyPatchChange', [AddedPatchChange, ModifiedPatchChange, DeletedPatchChange]);

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------
const env = xpEnv.concat([
  $Buffer,
  Path,
  XodFile,
  AnyXodFile,
  PatchFile,
  AttachmentFile,
  ProjectFile,
  XodFileContent,
  PatchFileContents,
  ProjectFileContents,
  AddedChangeType,
  ModifiedChangeType,
  DeletedChangeType,
  AnyChangeType,
  AddedPatchChange,
  ModifiedPatchChange,
  DeletedPatchChange,
  AnyPatchChange,
]);

export const def = HMDef.create({
  checkTypes: !!process.env.XOD_HM_DEF,
  env,
});
export default def;
