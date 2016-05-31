var projectMetadata = require("../project.description.js");
var path = require("path");

module.exports = {
    projectDirectory: projectMetadata.directory,
    sources: path.join(projectMetadata.directory, "angularjs")
};
