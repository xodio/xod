import R from 'ramda';

import { selectionLens } from '../editor/selectors';
import { SELECTION_ENTITY_TYPE } from '../editor/constants';
import { getCurrentPatchLinks, getCurrentPatchNodes } from '../project/selectors';

const removeInvalidSelections = (state) => {
  const nodes = getCurrentPatchNodes(state);
  const links = getCurrentPatchLinks(state);

  return R.over(
    selectionLens,
    R.filter(({ entity, id }) => {
      switch (entity) {
        case SELECTION_ENTITY_TYPE.NODE:
          return R.has(id, nodes);
        case SELECTION_ENTITY_TYPE.LINK:
          return R.has(id, links);
        default:
          return true;
      }
    })
  )(state);
};

export default removeInvalidSelections;
