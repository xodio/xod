import {Services} from './services/services';
import {DevelopmentServer} from './mode/server.development';
import {ProductionServer} from './mode/server.production';
import {TestServer} from './mode/server.test';

/**
 * Generic Server class responsible for launching server in specified config
 */
export class Server {

  /**
   * @param config possible modes are listed in /applicaiton.constants.js
   */
  constructor(config) {
    this._config = config;
  }

  /**
   * Server config
   * @returns {_config}
   */
  config() {
    return this._config;
  }

  /**
   * Server Instance
   * @returns {_instance}
   */
  instance() {
    return this._instance;
  }

  /**
   * This method launch Server in an appropriate config
   */
  launch() {
    this._instance = null;

    const serverClasses = [DevelopmentServer, ProductionServer, TestServer];

    for (let index in Object.keys(serverClasses)) {
      const ServerClass = serverClasses[index];
      if (ServerClass.name === this.config().name) {
        this._instance = new ServerClass(this.config());
        this.instance().launch();
      }
    }
  }
}
