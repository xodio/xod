const GenericServer = require('./server.generic');

class ProductionServer extends GenericServer {
  constructor(location, services) {
    super(location, services);
  }
}

ProductionServer.name = 'production';

module.exports = ProductionServer;
