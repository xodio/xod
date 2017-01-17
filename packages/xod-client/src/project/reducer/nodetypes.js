import R from 'ramda';
import { NODETYPES_UPDATE } from '../actionTypes';

export default (state = {}, action) => {
  switch (action.type) {
    case NODETYPES_UPDATE:
      return R.pathOr({}, ['payload', 'nodeTypes'], action);
    default:
      return state;
  }
};
