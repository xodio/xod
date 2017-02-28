import R from 'ramda';
import $ from 'sanctuary-def';
import HMDef from 'hm-def';
import { env as xEnv } from 'xod-project';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

//-----------------------------------------------------------------------------
//
// Type utilities
//
//-----------------------------------------------------------------------------

// :: String -> String
const qualifiedTypeName = typeName => `xod-arduino/${typeName}`;

// :: String -> String
const typeUrl = typeName => `http://xod.io/docs/dev/xod-arduino/#${typeName}`;

// :: (String, Any -> Boolean) -> Type
const NullaryType = (typeName, predicate) => $.NullaryType(
  qualifiedTypeName(typeName),
  typeUrl(typeName),
  predicate
);

// :: Type -> Any -> Boolean
// To keep checking fast we have to call private method of $.Type
// eslint-disable-next-line no-underscore-dangle
const hasType = type => x => type._test(x);

const Model = (typeName, schema) => NullaryType(
  typeName,
  hasType($.RecordType(schema))
);

const AliasType = (typeName, type) => NullaryType(
  typeName,
  hasType(type)
);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------
const TNodeId = AliasType('TNodeId', $.Number);
const TPinKey = AliasType('TPinKey', $.String);
const DataValue = NullaryType('DataValue', R.complement(R.isNil));

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
  isDirty: $.Boolean,
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
  patch: TPatch,
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

export const def = HMDef.create({ checkTypes: true, env });
export default def;
