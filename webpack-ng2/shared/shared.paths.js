var projectMetadata = require('../../project.description');
var path = require('path');

module.exports = {
  projectDirectory: projectMetadata.directory,
  sources: path.resolve(projectMetadata.directory, 'client')
};
