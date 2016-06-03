const GenericServer = require('./server.generic');
const ExpressEngine = require('../engine/engine.express');

class TestServer extends GenericServer {
  constructor(root, config) {
    super(root, config, new ExpressEngine(root, config));
  }
}

TestServer.configName = 'test';

module.exports = TestServer;
