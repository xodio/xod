import * as ActionType from './actionTypes';
import { STATUS } from 'xod-client/utils/constants';

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
