import R from 'ramda';

import { SELECTION_ENTITY_TYPE } from './constants';

export const isEntitySelected = (selection, entityName, id) => R.pipe(
  R.filter(R.propEq('entity', entityName)),
  R.find(R.propEq('id', id)),
  R.isNil,
  R.not
)(selection);

export const isNodeSelected = R.curry(
  (selection, id) => isEntitySelected(selection, SELECTION_ENTITY_TYPE.NODE, id)
);

export const isLinkSelected = R.curry(
  (selection, id) => isEntitySelected(selection, SELECTION_ENTITY_TYPE.LINK, id)
);

export const isPinSelected = (linkingPin, renderablePin) => (
  linkingPin &&
  linkingPin.nodeId === renderablePin.nodeId &&
  linkingPin.pinKey === renderablePin.key
);
