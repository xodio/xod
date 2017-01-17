import * as ActionType from './actionTypes';
import { MESSAGE_TYPE } from './constants';
import { STATUS } from '../utils/constants';

const getTimestamp = () => new Date().getTime();

export const addMessage = (type, message) => ({
  type: ActionType.MESSAGE_ADD,
  payload: message,
  meta: {
    type,
    timestamp: getTimestamp(),
    status: STATUS.STARTED,
  },
});

export const deleteMessage = id => ({
  type: ActionType.MESSAGE_DELETE,
  payload: {
    id,
  },
  meta: {
    timestamp: getTimestamp(),
    status: STATUS.DELETED,
  },
});

export const addError = error => addMessage(MESSAGE_TYPE.ERROR, error);
export const addConfirmation = error => addMessage(MESSAGE_TYPE.CONFIRMATION, error);
export const addNotification = error => addMessage(MESSAGE_TYPE.CONFIRMATION, error);
