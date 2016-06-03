const DevelopmentClient = require('./mode/client.development');
const ProductionClient = require('./mode/client.production');
const TestClient = require('./mode/client.test');
const GenericService = require('../service.generic.js');
const GenericRoute = require('../route.generic');
const Q = require('q');

class Client extends GenericService {
  constructor(config) {
    super(config);
    this._instance = null;
    this._route = new GenericRoute('/', '/dists/development/');
  }

  instance() {
    return this._instance;
  }

  discover() {
    const deferred = Q.defer();
    const clientClasses = [DevelopmentClient, ProductionClient, TestClient];
    for (let index in Object.keys(clientClasses)) {
      const ClientClass = clientClasses[index];
      if (ClientClass.mode === this.config().mode) {
        this._instance = new ClientClass(this.config());
        this.instance().discover();
        deferred.resolve(true);
        break;
      }
    }
    return deferred.promise;
  }

  stop() {
    this.instance().stop();
  }
}

Client.mode = 'client';

module.exports = Client;
