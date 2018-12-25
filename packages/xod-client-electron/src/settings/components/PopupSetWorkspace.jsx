import React from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
import { PopupForm } from 'xod-client';

class PopupSetWorkspace extends React.Component {
  constructor(props) {
    super(props);

    this.onClose = this.onClose.bind(this);
    this.onChange = this.onChange.bind(this);
    this.changeWorkspace = this.changeWorkspace.bind(this);
  }

  onChange(selection) {
    if (selection && selection.length > 0) {
      this.props.onChange(selection[0]);
    }
  }
  onClose() {
    if (this.props.isClosable) {
      this.props.onClose();
    }
  }

  getWorkspaceView() {
    if (!this.props.workspace) {
      return {
        currentWorkspace: (
          <p>
            To save your project you should choose a workspace directory.<br />
            We&apos;ll put all your projects into this directory, but you can
            easily switch it in the future.
          </p>
        ),
        buttonLabel: 'Select workspace directory',
      };
    }

    return {
      currentWorkspace: (
        <p>
          Current workspace directory:<br />
          <code>{this.props.workspace}</code>
        </p>
      ),
      buttonLabel: 'Switch workspace directory',
    };
  }

  changeWorkspace() {
    remote.dialog.showOpenDialog(
      {
        title: 'Choose workspace directory',
        properties: ['openDirectory'],
        buttonLabel: 'Choose directory',
      },
      this.onChange
    );
  }

  render() {
    const { currentWorkspace, buttonLabel } = this.getWorkspaceView();
    return (
      <PopupForm
        title="Choose your workspace directory"
        isVisible={this.props.isVisible}
        isClosable={this.props.isClosable}
        onClose={this.onClose}
      >
        <div className="ModalContent">{currentWorkspace}</div>
        <div className="ModalFooter">
          <button className="Button" onClick={this.changeWorkspace}>
            {buttonLabel}
          </button>
        </div>
      </PopupForm>
    );
  }
}

PopupSetWorkspace.propTypes = {
  workspace: PropTypes.string,
  isClosable: PropTypes.bool,
  isVisible: PropTypes.bool, // eslint-disable-line
  onChange: PropTypes.func,
  onClose: PropTypes.func,
};

export default PopupSetWorkspace;
