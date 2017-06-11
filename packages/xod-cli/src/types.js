import HMDef from 'hm-def';
import $ from 'sanctuary-def';
import XF from 'xod-func-tools';
import { env, Identifier } from 'xod-project';

/* Types are by convention starts with a capital letter, so: */
/* eslint-disable new-cap */

const docUrl = 'http://xod.io/docs/dev/xod-cli/#';
const packageName = 'xod-cli';
const Model = XF.Model(packageName, docUrl);

export const LibUri = Model('LibUri', {
  libname: Identifier,
  orgname: Identifier,
  tag: $.String,
});

export const def = HMDef.create({
  checkTypes: process.env.NODE_ENV !== 'production',
  env: env.concat(LibUri),
});
