const GenericClient = require('./client.generic');
const Ports = require('../../../helpers/host/ports');
const Q = require('q');
const exec = require('process-promises').exec;

class DevelopmentClient extends GenericClient {

  constructor(config) {
    super(config);
  }

  terminal() {
    return this._terminal;
  }

  launch() {
    const deferred = Q.defer();
    exec('xterm -hold -e bash -c "webpack-dev-server -d --hot --progress inline --color --config webpack.ng2.config.js"')
      .on('process', (process) => {
        this._terminal = process;
        deferred.resolve(process);
      });
    return deferred.promise;
  }

  stop() {
    Ports
      .free(this.config().port)
      .then(() => {
        process.kill(this.terminal().pid);
      }, () => {
        process.kill(this.terminal().pid);
      });
  }

  discover() {
    const deferred = Q.defer();
    Ports
      .free(this.config().port)
      .then(() => {
        this.launch()
          .then(() => deferred.resolve(true), () => deferred.reject(false));
      }, () => deferred.reject(false));
    return deferred.promise;
  }
}

DevelopmentClient.mode = 'development';

module.exports = DevelopmentClient;
