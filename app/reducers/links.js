import R from 'ramda';
import { NODE_DELETE, LINK_ADD, LINK_DELETE } from '../actionTypes';
import { getPinsByNodeId, getLinksByPinId } from '../selectors/project';

const nodeIds = (links) =>
  R.map(link => parseInt(link.id, 10))(R.values(links));

export const lastId = (links) => {
  const ids = nodeIds(links);
  // -1 is important because if nodes store doesn't contain nodes then we should return 0 as newId
  return R.reduce(R.max, 0, ids);
};

export const newId = (links) => lastId(links) + 1;

export const copyLink = (link) => R.clone(link);

export const links = (state = {}, action, patchState) => {
  let newLink = null;

  switch (action.type) {
    case LINK_ADD: {
      newLink = {
        pins: action.payload.pins,
      };
      newLink.id = newId(state);
      return R.set(R.lensProp(newLink.id), newLink, state);
    }
    case NODE_DELETE: {
      const pinsToDelete = getPinsByNodeId(patchState, { id: action.payload.id });
      const linksToDelete = R.pipe(
        R.values,
        R.reduce((prev, c) => {
          const pinLinks = getLinksByPinId(patchState, { pinIds: [c.id] });
          return R.concat(prev, pinLinks);
        }, []),
        R.map((pin) => String(pin.id))
      )(pinsToDelete);
      return R.omit(linksToDelete, state);
    }
    case LINK_DELETE:
      return R.omit([action.payload.id.toString()], state);
    default:
      return state;
  }
};
