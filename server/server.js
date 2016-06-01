import {Services} from './services/services';
import * as CONSTANTS from './server.constants';
import {DevelopmentServer} from './mode/server.development';
import {ProductionServer} from './mode/server.production';
import {TestServer} from './mode/server.test';

/**
 * Generic Server class responsible for launching server in specified mode
 */
export class Server {

  /**
   * @param mode possible modes are listed in /applicaiton.constants.js
   */
  constructor(mode) {
    this._mode = mode;
    this._services = new Services(this.mode());
  }

  /**
   * Server mode
   * @returns {_mode}
   */
  mode() {
    return this._mode;
  }

  /**
   * Server Services Set
   * @returns {_services}
   */
  services() {
    return this._services;
  }

  /**
   * Server location: host and port
   * @returns {_location}
   */
  location() {
    return this._location;
  }

  /**
   * Server Instance
   * @returns {_instance}
   */
  instance() {
    return this._instance;
  }

  /**
   * This method instantiate appropriate Server instance
   */
  laucnh() {
    this._instance = null;

    /**
     * Retrieve appropriate server
     */
    switch (this.mode()) {
      case CONSTANTS.MODE.DEVELOPMENT.NAME:
        this._location = CONSTANTS.MODE.DEVELOPMENT.SERVER;
        this._instance = new DevelopmentServer(this.location(), this.services());
        break;

      case CONSTANTS.MODE.PRODUCTION.NAME:
        this._location = CONSTANTS.MODE.PRODUCTION.SERVER;
        this._instance = new ProductionServer(this.location(), this.services());
        break;

      case CONSTANTS.MODE.TEST.NAME:
        this._location = CONSTANTS.MODE.TEST.SERVER;
        this._instance = new TestServer(this.location(), this.services());
        break;

      default:
        throw new Error('Unrecocknized server mode');
    }

    this.instance().launch();
  }
}
