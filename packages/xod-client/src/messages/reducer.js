import R from 'ramda';
import { MESSAGE_ADD, MESSAGE_DELETE } from './actionTypes';
import { getNewId } from './selectors';

export default (messages = {}, action) => {
  switch (action.type) {
    case MESSAGE_ADD: {
      const newId = getNewId(messages);
      return R.assoc(
        newId,
        {
          id: newId,
          type: action.meta.type,
          timestamp: action.meta.timestamp,
          payload: action.payload,
        },
        messages
      );
    }
    case MESSAGE_DELETE:
      return R.omit([action.payload.id.toString()], messages);
    default:
      return messages;
  }
};
