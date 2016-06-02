import {GenericClient} from './client.generic';

export class TestClient extends GenericClient {
  constructor(config) {
    super(config);
  }

  discover() {
  }

  stop() {
  }
}

TestClient.mode = 'test';