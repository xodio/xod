const methods = require('../utils/methods');

module.exports = function ProjectModel(Project) {
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
