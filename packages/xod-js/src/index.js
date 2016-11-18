// export { default as transpile } from './transpiler';
// export { default as runtime } from '../platform/runtime'; // eslint-disable-line import/named
export { default as nodejs } from './target-nodejs';
export { default as espruino } from './target-espruino';

import nodejs from './target-nodejs';
import espruino from './target-espruino';

export default {
  nodejs,
  espruino,
};
