import R from 'ramda';

export const getPins = (state) => R.pipe(
  R.view(R.lensProp('pins'))
)(state);

export const getPinsByNodeId = (state, props) => R.pipe(
  getPins,
  R.filter((pin) => pin.nodeId === props.id)
)(state, props);

export const getPinsByIds = (state, props) => R.pipe(
  getPins,
  R.values,
  R.reduce((p, pin) => {
    const n = p;
    if (props && props.pins && props.pins.indexOf(pin.id) !== -1) {
      n[pin.id] = pin;
    }
    return n;
  }, {})
)(state, props);
