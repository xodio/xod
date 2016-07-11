import R from 'ramda';
import { getFullPinsData, canPinHaveMoreLinks } from './pin';
import { LINK_ERRORS } from '../constants/errorMessages';

export const getLinks = R.view(R.lensPath(['project', 'links']));

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

export const validateLink = (state, fromPinId, toPinId) => {
  const pins = getFullPinsData(state);
  const linksState = getLinks(state);
  const fromPin = pins[fromPinId];
  const toPin = pins[toPinId];

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
  const result = {
    validness: check,
    message: '',
  };

  if (!check) {
    if (sameDirection) {
      result.message = LINK_ERRORS.SAME_DIRECTION;
    } else
    if (sameNode) {
      result.message = LINK_ERRORS.SAME_NODE;
    } else
    if (!fromPinCanHaveMoreLinks || !toPinCanHaveMoreLinks) {
      result.message = LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN;
    }
  }

  return result;
};
