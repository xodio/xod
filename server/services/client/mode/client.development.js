import {GenericClient} from './client.generic';
import {Ports} from '../../../helpers/host/ports';
import Q from 'q';
import shell from 'shelljs';

export class DevelopmentClient extends GenericClient {
  constructor(config) {
    super(config);
  }

  terminal() {
    return this._terminal;
  }

  launch() {
    const deferred = Q.defer();
    shell.env['NODE_ENV'] = 'development';
    shell.env['WEBPACK_PORT'] = this.config().port;
    this._terminal = shell.exec(
      'xterm -hold -e "bash -c webpack --watch --progress --color --config webpack.ng2.config.js"',
      function(code) {
        if (!code) {
          deferred.resolve(code);
        } else {
          deferred.reject(code);
        }
      }
    );
    return deferred.promise;
  }

  stop() {
    Ports
      .free(this.config().port)
      .then(() => {
        this.terminal().kill('SIGTERM');
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
