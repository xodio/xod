import React from 'react';
import SkyLight from 'react-skylight';

import { remote } from 'electron';

class PopupSetWorkspace extends React.Component {
  constructor(props) {
    super(props);

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

  show() {
    this.refs.popup.show();
  }

  hide() {
    this.refs.popup.hide();
  }

  getWorkspaceView() {
    if (!this.props.workspace) {
      return {
        currentWorkspace: (
          <p>
            To save your project you should choose a workspace directory.<br />
            We'll put all your projects into this directory, but you can easily switch it in the future.
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
    }
  }

  changeWorkspace() {
    remote.dialog.showOpenDialog({
      title: 'Choose workspace directory',
      properties: ['openDirectory'],
      buttonLabel: 'Choose directory',
    }, this.onChange);
  }

  onChange(selection) {
    if (selection && selection.length > 0) {
      this.props.onChange(selection[0]);
    }
  }

  render() {
    const { currentWorkspace, buttonLabel } = this.getWorkspaceView();
    return (
      <SkyLight
        hideOnOverlayClicked
        dialogStyles={{
          height: 'auto',
        }}
        ref="popup"
        title="Choose your workspace directory"
        onCloseClicked={this.props.onClose}
        onOverlayClicked={this.props.onClose}
      >
        {currentWorkspace}
        <p>
          <button onClick={this.changeWorkspace}>
            {buttonLabel}
          </button>
        </p>
      </SkyLight>
    );
  }
}

PopupSetWorkspace.propTypes = {
  workspace: React.PropTypes.string,
  isVisible: React.PropTypes.bool,
  onChange: React.PropTypes.func,
  onClose: React.PropTypes.func,
};

export default PopupSetWorkspace;
