const GenericServer = require('./server.generic');
const ExpressEngine = require('../engine/engine.express');

class DevelopmentServer extends GenericServer {
  constructor(root, config) {
    super(root, config, new ExpressEngine(root, config));
  }
}

DevelopmentServer.mode = 'development';

module.exports = DevelopmentServer;
