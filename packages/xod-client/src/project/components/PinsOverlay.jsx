import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import PinOverlay from './PinOverlay';
import { noop } from '../../utils/ramda';
import { isPinSelected } from '../../editor/utils';

class PinsOverlay extends React.Component {
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
      linkingPin,
    } = this.props;

    const pinsArr = R.values(pins);

    return (
      <svg
        key={this.id}
        {...position}
        {...size}
        className="NodePinsOverlay"
        viewBox={`0 0 ${size.width} ${size.height}`}
      >
        <g className="pins">
          {pinsArr.map(pin =>
            <g key={pin.key}>
              <PinOverlay
                {...pin}
                isSelected={isPinSelected(linkingPin, pin)}
                isAcceptingLinks={this.props.pinLinkabilityValidator(pin)}
                keyName={pin.key}
                key={`pin_${pin.key}`}
                onMouseUp={this.onPinMouseUp}
                onMouseDown={this.onPinMouseDown}
              />
            </g>
          )}
        </g>
      </svg>
    );
  }
}

PinsOverlay.propTypes = {
  id: PropTypes.string.isRequired,
  pins: PropTypes.any.isRequired,
  size: PropTypes.any.isRequired,
  position: PropTypes.object.isRequired,
  linkingPin: PropTypes.object,
  pinLinkabilityValidator: PropTypes.func,
  onPinMouseUp: PropTypes.func,
  onPinMouseDown: PropTypes.func,
};
PinsOverlay.defaultProps = {
  pinLinkabilityValidator: R.F,
  onPinMouseUp: noop,
  onPinMouseDown: noop,
};

export default PinsOverlay;
