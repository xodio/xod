var root = require("../../shared/webpack.paths").projectDirectory;
var path = require("path");

module.exports = {
    targets: [{
        test: path.join(root, "dists", "test")
    }]
};
