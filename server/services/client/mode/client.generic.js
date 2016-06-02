class GenericClient {
  constructor(config) {
    this._config = config;
  }

  config() {
    return this._config;
  }
}

module.exports = GenericClient;
