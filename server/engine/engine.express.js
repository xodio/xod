import express from 'express';
import {GenericEngine} from './engine.generic';
import Q from 'q';
import {Ports} from '../helpers/host/ports';

export class ExpressEngine extends GenericEngine {
  constructor(config) {
    super(config);
    this._instance = express();
  }

  instance() {
    return this._instance;
  }

  launch() {
    const deferred = Q.defer();
    Ports.free(this.config().server.port)
      .then(() => {
        this._httpd = this.instance().listen(this.config().server.port, () => {
          this.services().launch(this).then(() => {
            deferred.resolve(true);
          });
        });
      }, pids => deferred.reject(pids));
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
