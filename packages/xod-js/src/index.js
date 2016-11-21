// export { default as transpile } from './transpiler';
// export { default as runtime } from '../platform/runtime'; // eslint-disable-line import/named
export { default as transpileForNodeJS } from './target-nodejs';
export { default as transpileForEspruino } from './target-espruino';

import transpileForNodeJS from './target-nodejs';
import transpileForEspruino from './target-espruino';

export default {
  transpileForNodeJS,
  transpileForEspruino,
};
