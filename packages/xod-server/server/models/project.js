const errors = require('../constants/errors');
const methods = require('../utils/methods');


module.exports = function ProjectModel(Project) {
  // validation methods
  function checkProjectName(err) {
    if (/^[a-zA-Z0-9_\-]*$/.test(this.name) === false) {
      err();
    }
  }

  // validation bindings
  Project.validate(
    'validProjectName',
    checkProjectName,
    {
      message: errors.project.validProjectName,
    }
  );

  // methods
  methods.filter(
    [
      'create',
      'upsert',

      'deleteById',

      'find',
      'findOne',
      'findById',

      'count',
      'exists',

      '__get__author',
    ],
    Project
  );
};
