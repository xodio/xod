import $ from 'sanctuary-def';
import HMDef from 'hm-def';
import { Identifier, Node, Link, env as xpEnv } from 'xod-project';
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

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------
export const PatchFileContents = Model('PatchFileContents', {
  nodes: $.Array(Node),
  links: $.Array(Link),
  description: $.String,
});

export const ProjectFileContents = Model('ProjectFileContents', {
  name: Identifier,
  authors: $.Array($.String),
  license: $.String,
  description: $.String,
  version: $.String,
});

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------
const env = xpEnv.concat([
  PatchFileContents,
  ProjectFileContents,
]);

export const def = HMDef.create({
  checkTypes: process.env.NODE_ENV !== 'production',
  env,
});
export default def;
