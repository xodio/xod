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

  instances() {
    return this._instances;
  }

  launch() {
    const deferred = Q.defer();
    const servicesClasses = [Client, Logger, Hardware];
    const servicesModes = servicesClasses.map(serviceClass => serviceClass.mode);
    const servicesClassesHash = {};
    const servicesModesHash = {};
    for (let index in Object.keys(servicesClasses)) {
      servicesClassesHash[servicesModes[index]] = servicesClasses[index];
      servicesModesHash[servicesModes[index]] = this.config()[servicesModes[index]];
    }

    this._instances = Object.keys(this.config())
      .filter(serviceName => !!servicesClassesHash[serviceName])
      .map(serviceName => {
        const ServiceClass = servicesClassesHash[serviceName];
        const serviceConfig = servicesModesHash[serviceName];
        return new ServiceClass(serviceConfig);
      });


    const serviceStatuses = this.instances().map(service => service.discover());

    Q.all(serviceStatuses)
      .then(() => {
        deferred.resolve(true);
      }, () => {
        deferred.reject(false);
      });

    return deferred.promise;
  }

  stop() {
    const deferred = Q.defer();
    const promises = this.instances().map(service => service.stop());
    Q.all(promises).then(() => deferred.resolve(true), () => deferred.reject(false));
    return deferred.promise;
  }

  statuses() {
    const deferred = Q.defer();
    const statusesPromises = [];

    for (let index in Object.keys(this.instances())) {
      const service = this.instances()[index];
      statusesPromises.push(service.status());
    }

    Q.all(statusesPromises)
      .then((statuses) => deferred.resolve(statuses), () => deferred.reject(false));

    return deferred.promise;
  }

  status() {
    const deferred = Q.defer();

    this.statuses()
      .then((statuses) => {
        const validServicesCount = statuses.filter(status => status === GenericService.STATUS.VALID);
        if (validServicesCount === statuses.length) {
          deferred.resolve(Services.STATUS.VALID);
        } else {
          deferred.resolve(Services.STATUS.INVALID);
        }
      });

    return deferred.promise;
  }
}

Services.STATUS = {
  VALID: 'valid',
  INVALID: 'invalid'
};
