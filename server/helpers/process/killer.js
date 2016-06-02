import Q from 'q';
import ps from 'ps-node';

export const Killer = {
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

    Q.all(promises);
    return deferred.promise;
  }
};
