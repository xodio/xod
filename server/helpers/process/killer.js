const Q = require('q');
const ps = require('ps-node');

const Killer = {
  kill: (pids) => {
    const deferred = Q.defer();
    const promises = pids.map(pid => {
      const deferred = Q.defer();
      ps.kill(pid, (error) => {
        if (error) {
          deferred.reject(error);
        } else {
          deferred.resolve(pid);
        }
      });
      return deferred.promise;
    });

    Q.all(promises)
      .then(
        (pids) => deferred.resolve(pids),
        (info) => deferred.reject(info)
      );
    return deferred.promise;
  }
};

module.exports = Killer;
