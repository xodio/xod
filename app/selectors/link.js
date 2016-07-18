import R from 'ramda';
import { getFullPinsData, canPinHaveMoreLinks } from './pin';
import { LINK_ERRORS } from '../constants/errorMessages';
import ValidationError from '../utils/validationError';
import { getProject } from './project';

export const getLinks = R.pipe(
  getProject,
  R.prop('links')
);

export const getLinkById = (state, props) => R.pipe(
  getLinks,
  R.filter((link) => link.id === props.id),
  R.values,
  R.head
)(state, props);

export const getLinksByPinId = (state, props) => R.pipe(
  getLinks,
  R.filter(
    (link) => (
      props.pinIds.indexOf(link.fromPinId) !== -1 ||
      props.pinIds.indexOf(link.toPinId) !== -1
    )
  ),
  R.values
)(state, props);

export const validateLink = (state, pinIds) => {
  const pins = getFullPinsData(state);
  const linksState = getLinks(state);
  const fromPin = pins[pinIds[0]];
  const toPin = pins[pinIds[1]];

  const sameDirection = fromPin.direction === toPin.direction;
  const sameNode = fromPin.nodeId === toPin.nodeId;
  const fromPinCanHaveMoreLinks = canPinHaveMoreLinks(fromPin, linksState);
  const toPinCanHaveMoreLinks = canPinHaveMoreLinks(toPin, linksState);

  const check = (
    !sameDirection &&
    !sameNode &&
    fromPinCanHaveMoreLinks &&
    toPinCanHaveMoreLinks
  );

  if (!check) {
    let error;

    if (sameDirection) {
      error = new ValidationError(LINK_ERRORS.SAME_DIRECTION);
    } else
    if (sameNode) {
      error = new ValidationError(LINK_ERRORS.SAME_NODE);
    } else
    if (!fromPinCanHaveMoreLinks || !toPinCanHaveMoreLinks) {
      error = new ValidationError(LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN);
    }

    throw error;
  }

  return true;
};
