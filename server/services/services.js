import Q from 'q';

export class Services {
  constructor(config) {
    this._config = config;
  }

  config() {
    return this._config;
  }

  launch() {
    const deferred = Q.defer();
    deferred.resolve(true);
    return deferred.promise;
  }
}