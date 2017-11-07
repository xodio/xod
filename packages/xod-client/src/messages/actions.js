import * as ActionType from './actionTypes';
import { MESSAGE_TYPE } from './constants';
import { STATUS } from '../utils/constants';

const getTimestamp = () => new Date().getTime();

export const addMessage = (
  type,
  message,
  buttons = [],
  persistent = false
) => ({
  type: ActionType.MESSAGE_ADD,
  payload: { message, buttons },
  meta: {
    type,
    persistent,
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

export const addError = (...args) => addMessage(MESSAGE_TYPE.ERROR, ...args);
export const addConfirmation = (...args) =>
  addMessage(MESSAGE_TYPE.CONFIRMATION, ...args);
export const addNotification = (...args) =>
  addMessage(MESSAGE_TYPE.NOTIFICATION, ...args);
