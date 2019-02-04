import React from 'react';
import PropTypes from 'prop-types';
import { PopupForm } from 'xod-client';

import PortSelect from './PortSelect';

class PopupConnectSerial extends React.Component {
  constructor(props) {
    super(props);

    this.onClose = this.onClose.bind(this);
    this.onConnectClicked = this.onConnectClicked.bind(this);
  }

  onClose() {
    this.props.onClose();
  }

  onConnectClicked() {
    this.props.onConnect(this.props.selectedPort);
  }

  canUnpload() {
    return this.props.selectedPort && !this.props.isDeploymentInProgress;
  }

  render() {
    return (
      <PopupForm isVisible title="Connect Serial" onClose={this.onClose}>
        <div className="ModalContent">
          <PortSelect
            selectedPort={this.props.selectedPort}
            listPorts={this.props.listPorts}
            onPortChanged={this.props.onPortChanged}
          />
        </div>
        <div className="ModalFooter">
          <button
            onClick={this.onConnectClicked}
            className="Button"
            disabled={!this.canUnpload()}
          >
            Connect
          </button>
          {this.props.isDeploymentInProgress ? (
            <span className="busy-message">Deployment is in progress</span>
          ) : null}
        </div>
      </PopupForm>
    );
  }
}

PopupConnectSerial.propTypes = {
  isDeploymentInProgress: PropTypes.bool,
  selectedPort: PropTypes.object,
  listPorts: PropTypes.func,
  onPortChanged: PropTypes.func,
  onConnect: PropTypes.func,
  onClose: PropTypes.func,
};

PopupConnectSerial.defaultProps = {
  isVisible: false,
  isDeploymentInProgress: false,
};

export default PopupConnectSerial;
