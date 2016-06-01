import {GenericServer} from './server.generic';

export class ProductionServer extends GenericServer {
  constructor(location, services) {
    super(location, services);
  }
}

ProductionServer.name = 'production';
