import {Killer} from '../process/killer';
import lsof from 'lsof';
import Q from 'q';

export const Ports = {
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
