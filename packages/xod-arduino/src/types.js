import R from 'ramda';
import $ from 'sanctuary-def';
import HMDef from 'hm-def';
import { env as xEnv, PinKey, PinLabel, NodeId } from 'xod-project';
import XF from 'xod-func-tools';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

const packageName = 'xod-arduino';
const docUrl = 'http://xod.io/docs/dev/xod-arduino/#';

//-----------------------------------------------------------------------------
//
// Type utilities
//
//-----------------------------------------------------------------------------

const NullaryType = XF.NullaryType(packageName, docUrl);
const Model = XF.Model(packageName, docUrl);
const AliasType = XF.AliasType(packageName, docUrl);
const OneOfType = XF.OneOfType(packageName, docUrl);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------
const TNodeId = AliasType('TNodeId', $.Number);
const TPinKey = OneOfType('TPinKey', [PinKey, PinLabel]);
const DataValue = NullaryType('DataValue', R.complement(R.isNil));

export const TranspilationOptions = Model('TranspilationOptions', {
  debug: $.Boolean,
});

export const TConfig = Model('TConfig', {
  NODE_COUNT: $.Number,
  MAX_OUTPUT_COUNT: $.Number,
  XOD_DEBUG: $.Boolean,
});

const TPatchOutput = Model('TPatchOutput', {
  type: $.String,
  pinKey: $.String,
  value: DataValue,
});

const TPatchInput = Model('TPatchInput', {
  pinKey: $.String,
});

export const TPatch = Model('TPatch', {
  owner: $.String,
  libName: $.String,
  patchName: $.String,
  outputs: $.Array(TPatchOutput),
  inputs: $.Array(TPatchInput),
  impl: $.String,
});

const TNodeOutput = Model('TNodeOutput', {
  to: $.Array(TNodeId),
  pinKey: TPinKey,
  value: $.Nullable(DataValue),
});

const TNodeInput = Model('TNodeInput', {
  nodeId: TNodeId,
  patch: TPatch,
  pinKey: TPinKey,
  fromPinKey: TPinKey,
});

export const TNode = Model('TNode', {
  id: TNodeId,
  originalId: NodeId,
  patch: TPatch,
  outputs: $.Array(TNodeOutput),
  inputs: $.Array(TNodeInput),
  dirtyFlags: $.Number,
});

export const TProject = Model('TProject', {
  config: TConfig,
  patches: $.Array(TPatch),
  nodes: $.Array(TNode),
});

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------
const env = xEnv.concat([
  TranspilationOptions,
  TNodeId,
  TPinKey,
  TConfig,
  TPatchOutput,
  TPatchInput,
  TPatch,
  TNodeOutput,
  TNodeInput,
  TNode,
  TProject,
]);

export const def = HMDef.create({
  checkTypes: !!process.env.XOD_HM_DEF,
  env,
});
export default def;
