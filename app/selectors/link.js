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

  return (
    fromPin.direction !== toPin.direction &&
    fromPin.nodeId !== toPin.nodeId &&
    isPinCanHaveMoreLinks(fromPin, linksState) &&
    isPinCanHaveMoreLinks(toPin, linksState)
  );
};
