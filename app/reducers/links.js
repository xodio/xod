import { LINK_ADD, LINK_DELETE } from '../actionTypes';
import R from 'ramda';

const nodeIds = (links) =>
  R.map(link => parseInt(link.id, 10))(R.values(links));

export const lastId = (links) => {
  const ids = nodeIds(links);
  // -1 is important because if nodes store doesn't contain nodes then we should return 0 as newId
  return R.reduce(R.max, -1, ids);
};

export const newId = (links) => lastId(links) + 1;

export const copyLink = (link) => R.clone(link);

const link = (state, action) => {
  switch (action.type) {
    case LINK_ADD:
      return R.view(R.lensProp('payload'), action);
    default:
      return state;
  }
};

export const links = (state = {}, action) => {
  let newLink = null;
  let newLinkId = 0;

  switch (action.type) {
    case LINK_ADD:
      newLink = link(undefined, action);
      newLinkId = newId(state);
      newLink = R.set(R.lensProp('id'), newLinkId, newLink);
      return R.set(R.lensProp(newLinkId), newLink, state);
    case LINK_DELETE:
      return R.omit([action.payload.id.toString()], state);
    default:
      return state;
  }
};
