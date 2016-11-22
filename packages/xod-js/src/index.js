export { default as transpileForNodeJS } from './target-nodejs';
export { default as transpileForEspruino } from './target-espruino';

import transpileForNodeJS from './target-nodejs';
import transpileForEspruino from './target-espruino';

export default {
  transpileForNodeJS,
  transpileForEspruino,
};
