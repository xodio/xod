import * as ActionType from './actionTypes';
import { MESSAGE_TYPE } from './constants';
import { STATUS } from '../utils/constants';

const getTimestamp = () => new Date().getTime();

export const addMessage = (type, message) => ({
  type: ActionType.MESSAGE_ADD,
  payload: { message },
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

export const addError = message => addMessage(MESSAGE_TYPE.ERROR, message);
export const addConfirmation = message => addMessage(MESSAGE_TYPE.CONFIRMATION, message);
export const addNotification = message => addMessage(MESSAGE_TYPE.NOTIFICATION, message);
