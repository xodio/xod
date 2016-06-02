const Services = require('../services/services');

module.exports = class GenericEngine {
  constructor(config) {
    this._config = config;
    this._services = new Services(this.config().services);
  }

  config() {
    return this._config;
  }

  services() {
    return this._services;
  }
};
