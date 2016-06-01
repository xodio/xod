var root = require('../../shared/shared.paths.js').projectDirectory;
var path = require('path');

module.exports = {
  targets: {
    test: path.join(root, 'dists', 'test')
  }
};
