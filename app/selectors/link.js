import R from 'ramda';
import { getFullPinsData, isPinCanHaveMoreLinks } from './pin';

export const getLinks = R.prop('links');
export const getGlobalLinks = R.view(R.lensPath(['project', 'links']));

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
  const linksState = getGlobalLinks(state);
  const fromPin = pins[fromPinId];
  const toPin = pins[toPinId];

  const sameDirection = fromPin.direction === toPin.direction;
  const sameNode = fromPin.nodeId === toPin.nodeId;
  const fromPinCanHaveMoreLinks = isPinCanHaveMoreLinks(fromPin, linksState);
  const toPinCanHaveMoreLinks = isPinCanHaveMoreLinks(toPin, linksState);

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
      result.message += 'Can\'t create link between pins of the same direction!';
    } else
    if (sameNode) {
      result.message += 'Can\'t create link between pins of the same node!';
    } else
    if (!fromPinCanHaveMoreLinks) {
      result.message += 'Input pin can have only one link!';
    } else
    if (!toPinCanHaveMoreLinks) {
      result.message += 'Input pin can have only one link!';
    }
  }

  return result;
};
