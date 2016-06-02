const GenericService = require('../service.generic');

class Logger extends GenericService {
  constructor(config) {
    super(config);
  }
}

Logger.mode = 'logger';

module.exports = Logger;