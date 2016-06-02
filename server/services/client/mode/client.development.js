import {GenericClient} from './client.generic';

export class DevelopmentClient extends GenericClient {
  constructor(config) {
    super(config);
  }

  _launch() {
  }

  discover() {
  }
}
