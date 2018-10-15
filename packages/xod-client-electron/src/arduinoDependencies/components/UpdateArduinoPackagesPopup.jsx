import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { PopupForm } from 'xod-client';

import { checkArduinoDependencyUpdates } from '../runners';

class UpdateArduinoPackagesPopup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cores: null,
    };

    this.onClose = this.onClose.bind(this);
    this.checkUpdates = this.checkUpdates.bind(this);
    this.onUpdateConfirm = this.onUpdateConfirm.bind(this);

    this.renderCores = this.renderCores.bind(this);
  }

  componentDidMount() {
    this.checkUpdates();
  }

  onClose() {
    this.props.onClose();
  }

  onUpdateConfirm() {
    this.props.onUpdateConfirm();
  }

  checkUpdates() {
    this.setState({ cores: null });
    checkArduinoDependencyUpdates().then(cores => this.setState({ cores }));
  }

  renderCores() {
    if (!this.state.cores) {
      return <span>Checking for updates...</span>;
    }

    if (R.isEmpty(this.state.cores)) {
      return <span>All packages are up to date</span>;
    }

    return (
      <div>
        <p>Packages to upgrade:</p>
        <ul>
          {R.map(
            core => (
              <li key={core.ID}>
                {core.Name}: {core.Installed} &rarr; {core.Latest}
              </li>
            ),
            this.state.cores
          )}
        </ul>
      </div>
    );
  }

  render() {
    const disabled = !this.state.cores || R.isEmpty(this.state.cores);
    return (
      <PopupForm
        isVisible={this.props.isVisible}
        title="Upgrade Arduino Packages & Toolchains"
        onClose={this.onClose}
      >
        <div className="ModalContent">{this.renderCores()}</div>
        <div className="ModalFooter">
          <button
            onClick={this.onUpdateConfirm}
            className="Button"
            disabled={disabled}
          >
            Upgrade
          </button>
        </div>
      </PopupForm>
    );
  }
}

UpdateArduinoPackagesPopup.propTypes = {
  isVisible: PropTypes.bool,
  onUpdateConfirm: PropTypes.func,
  onClose: PropTypes.func,
};

UpdateArduinoPackagesPopup.defaultProps = {
  isVisible: false,
};

export default UpdateArduinoPackagesPopup;
