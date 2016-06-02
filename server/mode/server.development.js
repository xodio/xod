const GenericServer = require('./server.generic');
const ExpressEngine = require('../engine/engine.express');

class DevelopmentServer extends GenericServer {
  constructor(config) {
    super(config, new ExpressEngine(config));
  }
}

DevelopmentServer.mode = 'development';

module.exports = DevelopmentServer;
