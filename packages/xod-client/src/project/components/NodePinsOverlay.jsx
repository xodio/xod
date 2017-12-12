import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import PinOverlay from './PinOverlay';
import { noop } from '../../utils/ramda';
import { isPinSelected } from '../../editor/utils';

class NodePinsOverlay extends React.Component {
  shouldComponentUpdate(newProps) {
    return !R.eqBy(
      R.omit(['onPinMouseUp', 'onPinMouseDown', 'pinLinkabilityValidator']),
      newProps,
      this.props
    );
  }

  onPinMouseUp = (event, pinId) => {
    this.props.onPinMouseUp(event, this.props.id, pinId);
  };

  onPinMouseDown = (event, pinId) => {
    this.props.onPinMouseDown(event, this.props.id, pinId);
  };

  render() {
    const {
      id,
      linkingPin,
      nodeLabel,
      pins,
      position,
      size,
    } = this.props;

    const pinsArr = R.values(pins);

    return (
      <svg
        key={id}
        id={`nodePinsOverlay_${id}`}
        {...position}
        {...size}
        className="NodePinsOverlay"
        viewBox={`0 0 ${size.width} ${size.height}`}
        title={nodeLabel}
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

NodePinsOverlay.propTypes = {
  id: PropTypes.string.isRequired,
  nodeLabel: PropTypes.string.isRequired,
  pins: PropTypes.any.isRequired,
  size: PropTypes.any.isRequired,
  position: PropTypes.object.isRequired,
  linkingPin: PropTypes.object,
  pinLinkabilityValidator: PropTypes.func,
  onPinMouseUp: PropTypes.func,
  onPinMouseDown: PropTypes.func,
};
NodePinsOverlay.defaultProps = {
  pinLinkabilityValidator: R.F,
  onPinMouseUp: noop,
  onPinMouseDown: noop,
};

export default NodePinsOverlay;
