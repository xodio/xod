const Killer = require('../process/killer');
const lsof = require('lsof');
const Q = require('q');

const Ports = {
  free: (port) => {
    const deferred = Q.defer();
    lsof.rawTcpPort(port, (data) => {
      const pids = data.map(process => process.pid);
      Killer.kill(pids)
        .then(pids => deferred.resolve(pids), pids => deferred.reject(pids));
    });
    return deferred.promise;
  }
};

module.exports = Ports;