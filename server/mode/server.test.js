const GenericServer = require('./server.generic');
const ExpressEngine = require('../engine/engine.express');

class TestServer extends GenericServer {
  constructor(config) {
    super(config, new ExpressEngine(config));
  }
}

TestServer.configName = 'test';

module.exports = TestServer;
