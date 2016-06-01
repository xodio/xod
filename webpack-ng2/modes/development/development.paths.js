var root = require('../../shared/shared.paths').projectDirectory;
var path = require('path');

module.exports = {
  /**
   * Modes might contains more than one target
   */
  targets: {
    development: path.join(root, 'dists', 'development')
  }
};
