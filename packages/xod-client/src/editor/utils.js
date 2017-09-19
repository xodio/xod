import R from 'ramda';

import { SELECTION_ENTITY_TYPE } from './constants';

export const isEntitySelected = R.curry(
  (entityType, selection, id) => R.pipe(
    R.filter(R.propEq('entity', entityType)),
    R.find(R.propEq('id', id)),
    R.isNil,
    R.not
  )(selection)
);

export const isNodeSelected = isEntitySelected(SELECTION_ENTITY_TYPE.NODE);

export const isLinkSelected = isEntitySelected(SELECTION_ENTITY_TYPE.LINK);

export const isCommentSelected = isEntitySelected(SELECTION_ENTITY_TYPE.COMMENT);

export const isPinSelected = (linkingPin, renderablePin) => (
  linkingPin &&
  linkingPin.nodeId === renderablePin.nodeId &&
  linkingPin.pinKey === renderablePin.key
);

export const getSelectedEntityIdsOfType = R.curry((entityType, selection) => R.compose(
  R.map(R.prop('id')),
  R.filter(R.propEq('entity', entityType))
)(selection));
