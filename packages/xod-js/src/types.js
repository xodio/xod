import HMDef from 'hm-def';
import { env as xEnv, PinKey, PinLabel, DataType, DataValue } from 'xod-project';
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

const Model = XF.Model(packageName, docUrl);

//-----------------------------------------------------------------------------
//
// Domain types
//
//-----------------------------------------------------------------------------

export const TPin = Model('TPin', {
  key: PinKey,
  type: DataType,
  label: PinLabel,
  value: DataValue,
});

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------
const env = xEnv.concat([
  TPin,
]);

export const def = HMDef.create({
  checkTypes: process.env.NODE_ENV !== 'production',
  env,
});
export default def;
