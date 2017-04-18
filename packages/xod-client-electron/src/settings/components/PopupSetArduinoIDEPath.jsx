import { propOr } from 'ramda';
import React from 'react';
import SkyLight from 'react-skylight';
import { remote } from 'electron';

import { DEFAULT_APPLICATION_DIRECTORY } from '../constants';

class PopupSetArduinoIDEPath extends React.Component {
  constructor(props) {
    super(props);
    this.popup = null;
    this.assignPopupRef = this.assignPopupRef.bind(this);
    this.onChange = this.onChange.bind(this);
    this.browseIDE = this.browseIDE.bind(this);
    this.openDownloadPage = this.openDownloadPage.bind(this);
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
      let path = selection[0];
      if (process.platform === 'darwin') {
        path += '/Contents/MacOS/Arduino';
      }

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
  openDownloadPage() {
    const win = new remote.BrowserWindow({
      width: 800,
      height: 360,
      center: true,
      show: false,
      autoHideMenuBar: true,
    });
    win.loadURL('https://www.arduino.cc/en/Main/Software#download');
    win.once('ready-to-show', () => win.show());
    win.on('closed', () => this.browseIDE());
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
        title="Choose your workspace directory"
        afterClose={this.props.onClose}
      >
        <p>
          <strong>Could not find Arduino IDE executable.</strong><br />
          Please, click the button bellow and choose Arduino IDE, that installed on your computer.
        </p>
        <p>
          <button onClick={this.browseIDE}>
            Browse for Arduino IDE
          </button>
        </p>
        <hr />
        <p>
          <strong>Don&apos;t have an installed Arduino IDE?</strong><br />
          It&apos;s a pitty, but you have to install it to upload XOD-programms
          on Arduino devices.<br />
          So just download and install latest Arduino from official website:
        </p>
        <button onClick={this.openDownloadPage}>
          Open download page
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
