import R from 'ramda';
import React from 'react';
import classNames from 'classnames';

import Pin from './Pin';
import PinLabel from './PinLabel';
import NodeText from './NodeText';
import { noop } from '../../utils/ramda';

import { NODE_CORNER_RADIUS } from '../nodeLayout';

class NodePins extends React.Component {
  constructor(props) {
    super(props);
    this.id = this.props.id;

    this.onPinMouseUp = this.onPinMouseUp.bind(this);
    this.onPinMouseDown = this.onPinMouseDown.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return R.not(R.equals(newProps, this.props));
  }

  onPinMouseUp(pinId) {
    this.props.onPinMouseUp(this.id, pinId);
  }

  onPinMouseDown(pinId) {
    this.props.onPinMouseDown(this.id, pinId);
  }

  render() {
    const {
      size,
      position,
      pins,
    } = this.props;

    const pinsArr = R.values(pins);

    return (
      <svg
        key={this.id}
        {...position}
        {...size}
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{ overflow: 'visible' }}
      >
        {pinsArr.map(pin =>
          <Pin
            keyName={pin.key}
            {...pin}
            onMouseUp={this.onPinMouseUp}
            onMouseDown={this.onPinMouseDown}
          />
        )}
      </svg>
    );
  }
}

NodePins.propTypes = {
  id: React.PropTypes.string.isRequired,
  pins: React.PropTypes.any.isRequired,
  size: React.PropTypes.any.isRequired,
  position: React.PropTypes.object.isRequired,
  onPinMouseUp: React.PropTypes.func,
  onPinMouseDown: React.PropTypes.func,
};
NodePins.defaultProps = {
  onPinMouseUp: noop,
  onPinMouseDown: noop,
};

export default NodePins;
