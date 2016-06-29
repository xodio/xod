import R from 'ramda';
import * as SelectorPin from './pin';

export const getNodes = (state) => R.pipe(
  R.view(R.lensProp('nodes'))
)(state);

export const getNodeById = (state, props) => R.pipe(
  getNodes,
  R.filter((node) => node.id === props.id),
  R.values,
  R.head
)(state, props);

export const getNodesByPinIds = (state, props) => R.pipe(
  SelectorPin.getPins,
  R.filter((pin) =>
    props && props.pins && props.pins.indexOf(pin.id) !== -1
  ),
  R.values,
  R.reduce((p, pin) => {
    const n = p;
    n[pin.nodeId] = getNodeById(state, { id: pin.nodeId });
    return n;
  }, {})
)(state, props);
