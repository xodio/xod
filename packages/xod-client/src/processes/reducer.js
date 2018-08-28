import * as R from 'ramda';
import { STATUS } from '../utils/constants';
import { getNewId } from './selectors';

const makeProcess = (id, state, action) =>
  R.assoc(
    id,
    R.merge(action.payload, {
      id,
      type: action.type,
      status: action.meta.status,
    }),
    state
  );

const isProcess = action => action.meta && action.meta.status;

export default (processes = {}, action) => {
  if (!isProcess(action)) {
    return processes;
  }
  const newId = getNewId(processes);
  const id =
    action && action.payload && action.payload.id ? action.payload.id : newId;

  switch (action.meta.status) {
    case STATUS.STARTED:
      return makeProcess(newId, processes, action);
    case STATUS.PROGRESSED:
    case STATUS.SUCCEEDED:
    case STATUS.FAILED: {
      return makeProcess(id, processes, action);
    }
    case STATUS.DELETED:
      return R.omit([action.payload.id.toString()], processes);
    default:
      break;
  }

  return processes;
};
