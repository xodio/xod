import R from 'ramda';
import { NODE_DELETE, LINK_ADD, LINK_DELETE } from '../actionTypes';
import {
  getPinsByNodeIdInPatch,
  getLinksByPinIdInPatch,
} from '../selectors/project';
import {
  currentPatchHasThatPins,
  currentPatchHasThatNode,
  getCurrentPatchId,
} from '../utils/reducerUtils';

const nodeIds = (links) =>
  R.map(link => parseInt(link.id, 10))(R.values(links));

export const lastId = (links) => {
  const ids = nodeIds(links);
  // -1 is important because if nodes store doesn't contain nodes then we should return 0 as newId
  return R.reduce(R.max, 0, ids);
};

export const newId = (links) => lastId(links) + 1;

export const copyLink = (link) => R.clone(link);

export const links = (state = {}, action, projectState) => {
  let newLink = null;

  switch (action.type) {
    case LINK_ADD: {
      if (!currentPatchHasThatPins(state, action.payload.pins, projectState)) { return state; }

      newLink = {
        pins: action.payload.pins,
      };
      newLink.id = newId(state);
      return R.set(R.lensProp(newLink.id), newLink, state);
    }
    case NODE_DELETE: {
      if (!currentPatchHasThatNode(state, action.payload.id, projectState)) { return state; }

      const patchId = getCurrentPatchId(state, projectState);
      const pinsToDelete = getPinsByNodeIdInPatch(
        projectState,
        {
          id: action.payload.id,
          patchId,
        }
      );
      const linksToDelete = R.pipe(
        R.values,
        R.reduce((prev, c) => {
          const pinLinks = getLinksByPinIdInPatch(
            projectState,
            {
              pinIds: [c.id],
              patchId,
            }
          );
          return R.concat(prev, R.keys(pinLinks));
        }, [])
      )(pinsToDelete);
      return R.omit(linksToDelete, state);
    }
    case LINK_DELETE:
      return R.omit([action.payload.id.toString()], state);
    default:
      return state;
  }
};
