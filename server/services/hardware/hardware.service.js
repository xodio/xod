const GenericService = require('../service.generic');

class Hardware extends GenericService {
  constructor(config) {
    super(config);
  }
};

Hardware.mode = 'hardware';

module.exports = Hardware;
