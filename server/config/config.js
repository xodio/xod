import {developmentConfig} from 'development.config';
import {productionConfig} from 'production.config';
import {testConfig} from 'test.config';

export class ServerConfig {
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
