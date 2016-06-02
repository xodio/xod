export class GenericService {
  constructor(config) {
    this._config = config;
  }

  config() {
    return this._config;
  }
}
