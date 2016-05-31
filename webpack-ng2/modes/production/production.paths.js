var root = require("../../shared/shared.paths.js").projectDirectory;
var path = require("path");

module.exports = {
    targets: {
        production: path.join(root, "dists", "production")
    }
};
