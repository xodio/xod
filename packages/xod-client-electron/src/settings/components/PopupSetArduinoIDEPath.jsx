import { propOr } from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
import { PopupForm } from 'xod-client';

import { DEFAULT_APPLICATION_DIRECTORY } from '../constants';

class PopupSetArduinoIDEPath extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.browseIDE = this.browseIDE.bind(this);
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
  render() {
    return (
      <PopupForm
        title="Setup Arduino IDE"
        isVisible={this.props.isVisible}
        isClosable
        onClose={this.props.onClose}
      >
        <div className="ModalContent">
          <p>
            <strong>Could not find Arduino IDE executable.</strong>
          </p>
          <p>
            <button className="Button Button--light" onClick={this.browseIDE}>
              Point to installed Arduino IDE
            </button>
          </p>
          <hr />
          <p>
            <strong>Don&apos;t have an installed Arduino IDE?</strong><br />
            You need an installed Arduino IDE to compile
            and upload XOD programs to Arduino boards.
          </p>
          <a
            href="https://www.arduino.cc/en/Main/Software#download"
            target="_blank"
            rel="noopener noreferrer"
            className="Button Button--light"
          >
            Download & install Arduino IDE
          </a>
        </div>
      </PopupForm>
    );
  }
}

PopupSetArduinoIDEPath.propTypes = {
  isVisible: PropTypes.bool, // eslint-disable-line
  onChange: PropTypes.func,
  onClose: PropTypes.func,
};

export default PopupSetArduinoIDEPath;
