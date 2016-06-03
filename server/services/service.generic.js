const GenericRoute = require('./route.generic');

class GenericService {
  constructor(config) {
    this._config = config;
    this._status = GenericService.STATUS.VALID;
  }

  config() {
    return this._config;
  }

  status() {
    return this._status;
  }

  route() {
    return this._route;
  }
}

GenericService.STATUS = {
  VALID: 'valid',
  INVALID: 'invalid'
};

module.exports = GenericService;
