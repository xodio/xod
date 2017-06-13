import React from 'react';
import SkyLight from 'react-skylight';
import { remote } from 'electron';

class PopupSetWorkspace extends React.Component {
  constructor(props) {
    super(props);

    this.popup = null;

    this.assignPopupRef = this.assignPopupRef.bind(this);

    this.onClose = this.onClose.bind(this);
    this.onChange = this.onChange.bind(this);
    this.changeWorkspace = this.changeWorkspace.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.isVisible) {
      this.show();
    } else {
      this.hide();
    }
  }

  onChange(selection) {
    if (selection && selection.length > 0) {
      this.props.onChange(selection[0]);
    }
  }
  onClose() {
    if (!this.props.isClosable) {
      this.props.onClose();
    }
  }

  getWorkspaceView() {
    if (!this.props.workspace) {
      return {
        currentWorkspace: (
          <p>
            To save your project you should choose a workspace directory.<br />
            We&apos;ll put all your projects into this directory,
            but you can easily switch it in the future.
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
    remote.dialog.showOpenDialog({
      title: 'Choose workspace directory',
      properties: ['openDirectory'],
      buttonLabel: 'Choose directory',
    }, this.onChange);
  }

  show() {
    if (this.popup) {
      this.popup.show();
    }
  }

  hide() {
    if (this.popup) {
      this.popup.hide();
    }
  }

  assignPopupRef(ref) {
    this.popup = ref;
  }

  render() {
    const { currentWorkspace, buttonLabel } = this.getWorkspaceView();
    return (
      <SkyLight
        isClosable={this.props.isClosable}
        ref={this.assignPopupRef}
        title="Choose your workspace directory"
        afterClose={this.onClose}
      >
        <div className="ModalBody">
          <div className="ModalContent">
            {currentWorkspace}
          </div>
          <div className="ModalFooter">
            <button className="Button" onClick={this.changeWorkspace}>
              {buttonLabel}
            </button>
          </div>
        </div>
      </SkyLight>
    );
  }
}

PopupSetWorkspace.propTypes = {
  workspace: React.PropTypes.string,
  isClosable: React.PropTypes.bool,
  isVisible: React.PropTypes.bool, // eslint-disable-line
  onChange: React.PropTypes.func,
  onClose: React.PropTypes.func,
};

export default PopupSetWorkspace;
