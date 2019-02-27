import React from 'react';
import PT from 'prop-types';
import * as XP from 'xod-project';

import PinWidget from './pinWidgets/PinWidget';

class PulseTweakWidget extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.props.onSendTweakPulse(this.props.nodeId);
  }

  render() {
    return (
      <li>
        <PinWidget
          elementId="pulse-tweak"
          label="OUT"
          dataType={XP.PIN_TYPE.PULSE}
          direction={XP.PIN_DIRECTION.OUTPUT}
          isBindable
          isConnected
        >
          <button className="Button inspectorButton" onClick={this.handleClick}>
            Pulse
          </button>
        </PinWidget>
      </li>
    );
  }
}

PulseTweakWidget.propTypes = {
  nodeId: PT.string.isRequired,
  onSendTweakPulse: PT.func.isRequired,
};

export default PulseTweakWidget;
