import { propOr } from 'ramda';
import React from 'react';
import SkyLight from 'react-skylight';
import { shell, remote } from 'electron';

import { DEFAULT_APPLICATION_DIRECTORY } from '../constants';

const openDownloadPage = () => shell.openExternal('https://www.arduino.cc/en/Main/Software#download');

class PopupSetArduinoIDEPath extends React.Component {
  constructor(props) {
    super(props);
    this.popup = null;
    this.assignPopupRef = this.assignPopupRef.bind(this);
    this.onChange = this.onChange.bind(this);
    this.browseIDE = this.browseIDE.bind(this);
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
      const path = selection[0] + (process.platform === 'darwin' ? '/Contents/MacOS/Arduino' : '');

      this.props.onChange(path);
    }
  }

  browseIDE() {
    remote.dialog.showOpenDialog({
      title: 'Choose Arduino IDE executable',
      defaultPath: propOr('/', process.platform, DEFAULT_APPLICATION_DIRECTORY),
      properties: ['openFile'],
      buttonLabel: 'Choose Arduino',
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
    return (
      <SkyLight
        hideOnOverlayClicked
        dialogStyles={{
          height: 'auto',
        }}
        ref={this.assignPopupRef}
        title="Setup Arduino IDE"
        afterClose={this.props.onClose}
      >
        <p>
          <strong>Could not find Arduino IDE executable.</strong>
        </p>
        <p>
          <button onClick={this.browseIDE}>
            Point to installed Arduino IDE
          </button>
        </p>
        <hr />
        <p>
          <strong>Don&apos;t have an installed Arduino IDE?</strong><br />
          You need an installed Arduino IDE to compile and upload XOD programs to Arduino boards.
        </p>
        <button onClick={openDownloadPage}>
          Download & install Arduino IDE
        </button>
      </SkyLight>
    );
  }
}

PopupSetArduinoIDEPath.propTypes = {
  isVisible: React.PropTypes.bool, // eslint-disable-line
  onChange: React.PropTypes.func,
  onClose: React.PropTypes.func,
};

export default PopupSetArduinoIDEPath;
