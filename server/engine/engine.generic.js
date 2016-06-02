import {Services} from '../services/services';

export class GenericEngine {
  constructor(config) {
    this._config = config;
    this._services = new Services(config.services);
  }

  config() {
    return this._config;
  }

  services() {
    return this._services;
  }
}
