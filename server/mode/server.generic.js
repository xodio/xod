/**
 * @abstract
 */
module.exports = class GenericServer {
  constructor(root, config, engine) {
    this._config = config;
    this._engine = engine;
    this._root = root;
  }

  root() {
    return this._root;
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
};

