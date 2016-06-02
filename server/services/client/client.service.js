import {DevelopmentClient} from './mode/client.development';
import {ProductionClient} from './mode/client.production';
import {TestClient} from './mode/client.test';
import {GenericService} from '../service.generic.js';

export class Client extends GenericService {
  constructor(config) {
    super(config);
    this._instance = null;
  }

  instance() {
    return this._instance;
  }

  discover() {
    const clientClasses = [DevelopmentClient, ProductionClient, TestClient];
    for (let index in Object.keys(clientClasses)) {
      const ClientClass = clientClasses[index];
      if (ClientClass.mode === this.config().mode) {
        this._instance = new ClientClass(config);
        this.instance().discover();
        break;
      }
    }
  }
}

Client.mode = 'client';
