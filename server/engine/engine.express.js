const express = require('express');
const GenericEngine = require('./engine.generic');
const Q = require('q');
const Ports = require('../helpers/host/ports');

module.exports = class ExpressEngine extends GenericEngine {
  constructor(config) {
    super(config);
    this._instance = express();
  }

  instance() {
    return this._instance;
  }

  launch() {
    console.log('launching express');
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
      this.services().stop()
        .then(() => deferred.resolve(true), () => deferred.reject(false));
      deferred.resolve(true);
    });
    return deferred.promise;
  }
}
