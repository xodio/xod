/**
 * @abstract
 */
export class GenericServer {
  constructor(config, engine) {
    this._config = config;
    this._engine = engine;
  }

  config() {
    return this._config;
  }

  engine() {
    return this._engine;
  }

  launch() {
    return this.engine().launch();
  }

  stop() {
    return this.engine().stop();
  }
}
