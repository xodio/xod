import {Client} from './client/client.service';
import {Logger} from './logger/logger.service';
import {Hardware} from './hardware/hardware.service';
import {GenericService} from './service.generic';
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
    const servicesClasses = [Client, Logger, Hardware];
    const servicesModes = servicesClasses.map(serviceClass => serviceClass.mode);
    const servicesClassesHash = {};
    for (let index in Object.keys(servicesClasses)) {
      servicesClassesHash[servicesModes[index]] = servicesClasses[index];
    }

    const servicesStatuses = Object.keys(this.config())
      .map(serviceName => servicesClassesHash[serviceName])
      .filter(service => service instanceof GenericService)
      .map(service => service.launch());

    Q.all(servicesStatuses)
      .then(() => {
        deferred.resolve(true);
      }, () => {
        deferred.reject(false);
      });

    return deferred.promise;
  }
}
