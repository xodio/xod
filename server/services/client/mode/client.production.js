import {GenericClient} from './client.generic';

export class ProductionClient extends GenericClient {
  constructor(config) {
    super(config);
  }
}

ProductionClient.mode = 'production';