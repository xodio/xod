import { LINK_ADD, LINK_DELETE } from '../actionTypes';
import R from 'ramda';
import Selectors from '../selectors';

const nodeIds = (links) =>
  R.map(link => parseInt(link.id, 10))(R.values(links));

export const lastId = (links) => {
  const ids = nodeIds(links);
  // -1 is important because if nodes store doesn't contain nodes then we should return 0 as newId
  return R.reduce(R.max, -1, ids);
};

export const newId = (links) => lastId(links) + 1;

export const copyLink = (link) => R.clone(link);

export const links = (state = {}, action, context) => {
  let newLink = null;

  switch (action.type) {
    case LINK_ADD: {
      const pins = Selectors.Pin.getFullPinsData(context);
      const linksState = Selectors.Link.getGlobalLinks(context);
      const fromPin = pins[action.payload.fromPinId];
      const toPin = pins[action.payload.toPinId];

      const linkCanBeCreated = (
        fromPin.direction !== toPin.direction &&
        Selectors.Pin.isPinCanHaveMoreLinks(fromPin, linksState) &&
        Selectors.Pin.isPinCanHaveMoreLinks(toPin, linksState)
      );

      if (!linkCanBeCreated) {
        throw new Error('Link cannot been created');
      }

      newLink = {
        fromPinId: action.payload.fromPinId,
        toPinId: action.payload.toPinId,
      };
      newLink.id = newId(state);
      return R.set(R.lensProp(newLink.id), newLink, state);
    }
    case LINK_DELETE:
      return R.omit([action.payload.id.toString()], state);
    default:
      return state;
  }
};
