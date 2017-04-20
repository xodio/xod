import HMDef from 'hm-def';
import { env } from 'xod-project';

export const def = HMDef.create({
  checkTypes: process.env.NODE_ENV !== 'production',
  env,
});
export default def;
