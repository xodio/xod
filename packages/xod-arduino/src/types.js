import * as R from 'ramda';
import $ from 'sanctuary-def';
import HMDef from 'hm-def';
import { env as xEnv, PinKey, PinLabel, NodeId } from 'xod-project';
import * as XF from 'xod-func-tools';

import { LIVENESS } from './constants';

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
const EnumType = XF.EnumType(packageName, docUrl);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------
const TNodeId = AliasType('TNodeId', $.Number);
const TPinKey = OneOfType('TPinKey', [PinKey, PinLabel]);
const DataValue = NullaryType('DataValue', R.complement(R.isNil));

export const Liveness = EnumType('Liveness', [
  LIVENESS.NONE,
  LIVENESS.DEBUG,
  LIVENESS.SIMULATION,
]);

const TGlobal = Model('TGlobal', {
  key: $.String,
  value: $.String,
});

export const TConfig = Model('TConfig', {
  XOD_DEBUG: $.Boolean,
  XOD_SIMULATION: $.Boolean,
  globals: $.Array(TGlobal),
});

const TPatchOutput = Model('TPatchOutput', {
  type: $.String,
  pinKey: $.String,
  value: DataValue,
  isDirtyable: $.Boolean,
  isDirtyOnBoot: $.Boolean,
  // isTemplatableCustomTypePin: $.Boolean,
  // isOutputSelf: $.Boolean,
  // shortCirquitInputKey: $.String,
});

const TPatchInput = Model('TPatchInput', {
  type: $.String,
  pinKey: $.String,
  isDirtyable: $.Boolean,
  // isTemplatableCustomTypePin: $.Boolean,
});

export const TPatch = Model('TPatch', {
  patchPath: $.String,
  isDefer: $.Boolean,
  isConstant: $.Boolean,
  usesTimeouts: $.Boolean,
  catchesErrors: $.Boolean,
  raisesErrors: $.Boolean,
  usesNodeId: $.Boolean,
  outputs: $.Array(TPatchOutput),
  inputs: $.Array(TPatchInput),
  impl: $.String,
  requirements: $.Array($.String),
  // isConstructor
});

const TNodeOutputDestination = Model('TNodeOutputDestination', {
  id: TNodeId,
  doesAffectDirtyness: $.Boolean,
});

// !!!: Before rendering program.tpl.cpp, data from corresponding
// `TPatchOutput`s gets mixed in here by `mergePins` helper
const TNodeOutput = Model('TNodeOutput', {
  type: $.String,
  to: $.Array(TNodeOutputDestination),
  pinKey: TPinKey,
  value: $.Nullable(DataValue),
});

// !!!: Before rendering program.tpl.cpp, data from corresponding
// `TPatchInput`s gets mixed in here by `mergePins` helper
const TNodeInput = Model('TNodeInput', {
  type: $.String,
  pinKey: TPinKey,
  fromNodeId: TNodeId,
  fromPatch: TPatch,
  fromOutput: TPatchOutput,
  fromPinKey: TPinKey,
});

const UpstreamErrorRaiser = Model('UpstreamErrorRaiser', {
  nodeId: TNodeId,
  pinKey: TPinKey,
});

export const TNode = Model('TNode', {
  id: TNodeId,
  originalId: NodeId,
  patch: TPatch,
  upstreamErrorRaisers: $.Array(UpstreamErrorRaiser),
  outputs: $.Array(TNodeOutput),
  inputs: $.Array(TNodeInput),
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
  Liveness,
  TNodeId,
  TPinKey,
  TConfig,
  TPatchOutput,
  TPatchInput,
  TPatch,
  TNodeOutputDestination,
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
