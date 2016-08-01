import R from 'ramda';
import { NODE_DELETE, LINK_ADD, LINK_DELETE } from '../actionTypes';
import { forThisPatch, isLinksInThisPatch } from '../utils/actions';

export const copyLink = (link) => R.clone(link);

export const links = (state = {}, action, patchId) => {
  switch (action.type) {
    case LINK_ADD: {
      if (!forThisPatch(action, patchId)) { return state; }

      const newLink = {
        id: action.payload.newId,
        pins: action.payload.pins,
      };
      return R.set(R.lensProp(newLink.id), newLink, state);
    }
    case NODE_DELETE: {
      if (!isLinksInThisPatch(state, action.payload.links)) { return state; }
      return R.omit(action.payload.links, state);
    }
    case LINK_DELETE:
      if (!isLinksInThisPatch(state, [action.payload.id.toString()])) { return state; }
      return R.omit([action.payload.id.toString()], state);
    default:
      return state;
  }
};
