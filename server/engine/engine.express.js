/* global __dirname */

const express = require('express');
const livereload = require('express-livereload')
const GenericEngine = require('./engine.generic');
const Q = require('q');
const Ports = require('../helpers/host/ports');

module.exports = class ExpressEngine extends GenericEngine {
  constructor(root, config) {
    super(config);
    this._root = root;
    this._instance = express();
    this.registeredRoutes = {};
  }

  root() {
    return this._root;
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
      this.services().stop()
        .then(() => deferred.resolve(true), () => deferred.reject(false));
      deferred.resolve(true);
    });
    return deferred.promise;
  }

  registerRoute(route) {
    console.log(__dirname + route.resource());
    this.instance().use(route.uri(), express.static(this.root() + route.resource()));
  }

  removeRoute(route) {
  }

  attach(service) {
    this.registerRoute(service.route());
  }

  detach(service) {
    this.removeRoute(service.route());
  }
};
