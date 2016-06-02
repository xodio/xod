const DevelopmentServer = require('./mode/server.development');
const ProductionServer = require('./mode/server.production');
const TestServer = require('./mode/server.test');

/**
 * Generic Server class responsible for launching server in specified config
 */
module.exports = class Server {

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

    console.log(this.config());

    const serverClasses = [DevelopmentServer, ProductionServer, TestServer];

    for (let index in Object.keys(serverClasses)) {
      const ServerClass = serverClasses[index];
      if (ServerClass.mode === this.config().name) {
        this._instance = new ServerClass(this.config());
        this.instance().launch();
      }
    }
  }
}
