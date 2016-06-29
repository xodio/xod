import R from 'ramda';

export const getLinks = (state) => R.pipe(
  R.view(R.lensProp('links'))
)(state);

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
