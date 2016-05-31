var root = require("../../shared/shared.paths").projectDirectory;
var path = require("path");

module.exports = {
    targets: [{
        development: path.join(root, "dists", "development")
    }]
};
