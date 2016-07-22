import R from 'ramda';
import { ERROR } from '../actionTypes';
import * as STATUS from '../constants/statuses';
import { getNewId } from '../selectors/errors';

export const errorsReducer = (errors = {}, action) => {
  if (
    action.type === ERROR &&
    action.meta &&
    action.meta.status
  ) {
    switch (action.meta.status) {
      case STATUS.STARTED: {
        const newId = getNewId(errors);
        return R.assoc(
          newId,
          {
            id: newId,
            timestamp: action.meta.timestamp,
            status: action.meta.status,
            payload: action.payload,
          },
          errors
        );
      }
      case STATUS.SUCCEEDED: {
        if (!errors.hasOwnProperty(action.payload.id)) { return errors; }

        return R.assoc(
          action.payload.id,
          R.merge(
            errors[action.payload.id],
            {
              timestamp: action.meta.timestamp,
              status: action.meta.status,
            }
          ),
          errors
        );
      }
      case STATUS.DELETED:
        return R.omit([action.payload.id.toString()], errors);
      default: break;
    }
  }

  return errors;
};
