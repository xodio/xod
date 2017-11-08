import R from 'ramda';

import { editorLens } from '../editor/selectors';
import { currentTabLens, selectionLens } from '../editor/reducer';
import { SELECTION_ENTITY_TYPE } from '../editor/constants';
import { getCurrentPatchLinks, getCurrentPatchNodes, getCurrentPatchComments } from '../project/selectors';

const removeInvalidSelections = (state) => {
  const nodes = getCurrentPatchNodes(state);
  const links = getCurrentPatchLinks(state);
  const comments = getCurrentPatchComments(state);

  return R.over(
    R.compose(editorLens, currentTabLens, selectionLens),
    R.filter(({ entity, id }) => {
      switch (entity) {
        case SELECTION_ENTITY_TYPE.NODE:
          return R.has(id, nodes);
        case SELECTION_ENTITY_TYPE.LINK:
          return R.has(id, links);
        case SELECTION_ENTITY_TYPE.COMMENT:
          return R.has(id, comments);
        default:
          return true;
      }
    })
  )(state);
};

export default removeInvalidSelections;
