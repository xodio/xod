var root = require("../project.description.js").projectDirectory;
var path = require("path");

module.exports = {
    targets: [{
        production: path.join(root, "dists", "development")
    }]
};
