const GenericClient = require('./client.generic');

class TestClient extends GenericClient {
  constructor(config) {
    super(config);
  }

  discover() {
  }

  stop() {
  }
}

TestClient.mode = 'test';

module.exports = TestClient;
