import R from 'ramda';

export default function deepSCU(nextProps, nextState) {
  return !R.equals(this.props, nextProps) || !R.equals(this.state, nextState);
}
