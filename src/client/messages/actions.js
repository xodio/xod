import * as ActionType from './actionTypes';
import * as STATUS from 'xod/client/constants/statuses';

const getTimestamp = () => new Date().getTime();

export const addError = (error) => ({
  type: ActionType.ERROR_ADD,
  payload: error,
  meta: {
    timestamp: getTimestamp(),
    status: STATUS.STARTED,
  },
});

export const deleteError = (id) => ({
  type: ActionType.ERROR_DELETE,
  payload: {
    id,
  },
  meta: {
    timestamp: getTimestamp(),
    status: STATUS.DELETED,
  },
});