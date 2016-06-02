const developmentConfig = require('./development.config');
const productionConfig = require('./production.config');
const testConfig = require('./test.config');

class ServerConfig {
  constructor(mode) {
    this._mode = mode;
  }

  mode() {
    return this._mode;
  }

  resolve() {
    const configs = [developmentConfig, productionConfig, testConfig];
    for (let index in Object.keys(configs)) {
      const config = configs[index];
      if (config.name === this._mode) {
        return config;
      }
    }
    return configs;
  }
}

module.exports = ServerConfig;
