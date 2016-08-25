import R from 'ramda';
import { ERROR_ADD, ERROR_DELETE } from './actionTypes';
import { getNewId } from './selectors';

export default (errors = {}, action) => {
  switch (action.type) {
    case ERROR_ADD: {
      const newId = getNewId(errors);
      return R.assoc(
        newId,
        {
          id: newId,
          timestamp: action.meta.timestamp,
          payload: action.payload,
        },
        errors
      );
    }
    case ERROR_DELETE:
      return R.omit([action.payload.id.toString()], errors);
    default:
      return errors;
  }
};
