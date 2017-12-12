import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { STATUS, PopupForm } from 'xod-client';
import { Line as ProgressBar } from 'rc-progress';

class PopupUploadProject extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: props.isVisible,
    };
  }

  onClose = () => {
    if (this.canClose()) {
      this.props.onClose(this.props.upload.id);
    }
  };

  getTitle() {
    switch (this.props.upload.status) {
      default:
        return 'Uploading project';
    }
  }

  getMessage() {
    const preStyle = {
      overflow: 'auto',
      maxWidth: 'auto',
      maxHeight: '300px',
      // allow user to select the log for bug reporting etc
      userSelect: 'initial',
      cursor: 'auto',
    };

    const message = (this.props.upload.message) ?
      (<pre style={preStyle}>{this.props.upload.message.replace(/\r[^\n]/g, '\n')}</pre>) :
      null;


    const titleMessage = R.cond([
      [R.equals(STATUS.SUCCEEDED), R.always(
        <p>
          The program uploaded successfully.
        </p>
      )],
      [R.equals(STATUS.FAILED), R.always(
        <p>
          Oops! Error occured.
        </p>
      )],
      [R.T, R.always(
        <p>
          Your program is uploading onto device.<br />
          Do not unplug the device.
        </p>
      )],
    ])(this.props.upload.status);

    return (
      <div>
        {titleMessage}
        {message}
      </div>
    );
  }

  getProgress() {
    if (this.isSucceeded()) {
      return '100';
    }

    if (this.props.upload.percentage) {
      return this.props.upload.percentage.toString();
    }

    return '0';
  }

  isSucceeded() {
    return (this.props.upload.status === STATUS.SUCCEEDED);
  }

  isFailed() {
    return (this.props.upload.status === STATUS.FAILED);
  }

  canClose() {
    return (this.isSucceeded() || this.isFailed());
  }

  render() {
    const title = this.getTitle();
    const message = this.getMessage();
    const progress = this.getProgress();
    const color = this.isFailed() ? '#ed5b5b' : '#81c522';

    return (
      <PopupForm
        isVisible={this.props.isVisible}
        title={title}
        isClosable={this.canClose()}
        onClose={this.onClose}
      >
        <div className="ModalContent">
          <ProgressBar
            percent={progress}
            strokeWidth="5"
            strokeColor={color}
            strokeLinecap="square"
            trailWidth="5"
            trailColor="#373737"
            className="ProgressBar"
          />
        </div>
        <div className="ModalContent">
          {message}
        </div>
      </PopupForm>
    );
  }
}

PopupUploadProject.propTypes = {
  upload: PropTypes.object,
  isVisible: PropTypes.bool,
  onClose: PropTypes.func,
};

PopupUploadProject.defaultProps = {
  upload: {
    status: STATUS.STARTED,
    message: '',
    percentage: 0,
  },
  isVisible: false,
};

export default PopupUploadProject;
