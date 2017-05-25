import R from 'ramda';
import $ from 'sanctuary-def';
import HMDef from 'hm-def';
import { Identifier, Patch, Node, Link, env as xpEnv } from 'xod-project';
import XF from 'xod-func-tools';

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

export const Path = NullaryType('Path', x => XF.hasType($.String, x) && XF.notEmpty(x));

// :: x -> Boolean
const isValidXodFile = R.converge(
  R.and,
  [
    R.allPass([
      R.has('path'),
      R.has('content'),
    ]),
    R.compose(
      XF.hasType(Path),
      R.prop('path')
    ),
  ]
);

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
  description: $.String,
});

export const PatchFile = AliasType('PatchFile', XodFile(PatchFileContents));
export const PatchImplFile = AliasType('PatchImplFile', XodFile($.String));

export const ProjectFileContents = Model('ProjectFileContents', {
  name: Identifier,
  authors: $.Array($.String),
  license: $.String,
  description: $.String,
  version: $.String,
});

export const ProjectFile = AliasType('ProjectFile', XodFile(ProjectFileContents));

// TODO: Remove last `XodFile(Patch)` after refactoring of loadProject* and readXodFile functions
export const AnyXodFile = OneOfType('AnyXodFile', [ProjectFile, PatchFile, PatchImplFile, XodFile(Patch)]);

export const XodFileContent = OneOfType('XodFileContent', [ProjectFileContents, PatchFileContents, Patch, $.String]);

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------
const env = xpEnv.concat([
  Path,
  XodFile,
  AnyXodFile,
  PatchFile,
  PatchImplFile,
  ProjectFile,
  XodFileContent,
  PatchFileContents,
  ProjectFileContents,
]);

export const def = HMDef.create({
  checkTypes: process.env.NODE_ENV !== 'production',
  env,
});
export default def;
