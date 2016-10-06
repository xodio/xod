
// Work around bug of redux-api-middleware + Babel 6
// See: https://github.com/agraboso/redux-api-middleware/issues/83
const regeneratorRuntime = require('babel-runtime/regenerator');
if (!regeneratorRuntime.default) {
  regeneratorRuntime.default = regeneratorRuntime;
}
