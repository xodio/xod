const GenericClient = require('./client.generic');

class ProductionClient extends GenericClient {
  constructor(config) {
    super(config);
  }
}

ProductionClient.mode = 'production';

module.exports = ProductionClient;