const methods = require('../utils/methods');

module.exports = function PakcageModel(Package) {
  methods.filter(
    [
      'create',

      'find',
      'findOne',
      'findById',

      'count',
      'exists',

      '__get__author',
    ],
    Package
  );
};
