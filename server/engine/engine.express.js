import express from 'express';
import expressJade from 'express-jade';
import {GenericEngine} from './engine.generic';
import {Services} from '../services/services';
import Q from 'q';

export class ExpressEngine extends GenericEngine {
  constructor(config) {
    super(config);
    this._instance = express();
    this._services = new Services(config);
  }

  instance() {
    return this._instance;
  }

  services() {
    return this._services;
  }

  launch() {
    const deferred = Q.defer();
    this._httpd = this.instance().listen(this.config().server.port, () => {
      this.services().launch(this, this.config().services).then(() => {
        deferred.resolve(true);
      });
    });
    return deferred.promise;
  }

  stop() {
    const deferred = Q.defer();
    this._httpd.close(() => {
      deferred.resolve(true);
    });
    return deferred.promise;
  }
}
