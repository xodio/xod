import * as R from 'ramda';
import * as ActionType from './actionTypes';
import { MESSAGE_TYPE } from './constants';

const getTimestamp = () => new Date().getTime();

const getDefaultPersistencyByType = R.equals(MESSAGE_TYPE.ERROR);

export const addMessage = (type, messageData, id = null) => ({
  type: ActionType.MESSAGE_ADD,
  payload: messageData,
  meta: {
    id,
    type,
    persistent: R.propOr(
      getDefaultPersistencyByType(type),
      'persistent',
      messageData
    ),
    timestamp: getTimestamp(),
  },
});

export const deleteMessage = id => ({
  type: ActionType.MESSAGE_DELETE,
  payload: {
    id,
  },
  meta: {
    timestamp: getTimestamp(),
  },
});

export const addError = (...args) => addMessage(MESSAGE_TYPE.ERROR, ...args);
export const addConfirmation = (...args) =>
  addMessage(MESSAGE_TYPE.CONFIRMATION, ...args);
export const addNotification = (...args) =>
  addMessage(MESSAGE_TYPE.NOTIFICATION, ...args);

export const messageButtonClick = messageId => ({
  type: ActionType.MESSAGE_BUTTON_CLICKED,
  payload: messageId,
});
