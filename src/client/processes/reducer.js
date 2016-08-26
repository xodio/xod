import R from 'ramda';
import { STATUS } from 'xod/client/utils/constants';
import { getNewId } from './selectors';

export default (processes = {}, action) => {
  const isProcess = (action.meta && action.meta.status);
  if (!isProcess) { return processes; }

  const makeProcess = (id, state, act) =>
    R.assoc(
      id,
      R.merge(
        act.payload,
        {
          id,
          type: action.type,
          status: action.meta.status,
        }
      ),
      state
    );

  switch (action.meta.status) {
    case STATUS.STARTED:
      return makeProcess(
        getNewId(processes),
        processes,
        action
      );
    case STATUS.PROGRESSED:
    case STATUS.SUCCEEDED:
    case STATUS.FAILED:
      return makeProcess(
        action.payload.id,
        processes,
        action
      );
    case STATUS.DELETED:
      return R.omit(
        [action.payload.id.toString()],
        processes
      );
    default: break;
  }

  return processes;
};
