var root = require("../../shared/webpack.paths").projectDirectory;
var path = require("path");

module.exports = {
    targets: [{
        production: path.join(root, "dists", "production")
    }]
};
