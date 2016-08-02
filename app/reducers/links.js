import R from 'ramda';
import { NODE_DELETE, LINK_ADD, LINK_DELETE } from '../actionTypes';

export const copyLink = (link) => R.clone(link);

export const links = (state = {}, action) => {
  switch (action.type) {
    case LINK_ADD: {
      const newLink = {
        id: action.payload.newId,
        pins: action.payload.pins,
      };
      return R.set(R.lensProp(newLink.id), newLink, state);
    }
    case NODE_DELETE: {
      return R.omit(action.payload.links, state);
    }
    case LINK_DELETE:
      return R.omit([action.payload.id.toString()], state);
    default:
      return state;
  }
};
