import React from 'react';
import client from 'xod-client';
import { SkyLightStateless } from 'react-skylight';
import { Line as ProgressBar } from 'rc-progress';

class PopupUploadProject extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: props.isVisible,
    };

    this.onClose = this.onClose.bind(this);
  }

  onClose() {
    if (this.canClose()) {
      this.props.onClose(this.props.upload.id);
    }
  }

  getTitle() {
    switch (this.props.upload.status) {
      default:
        return 'Uploading project';
    }
  }

  getMessage() {
    const message = (this.props.upload.message) ?
      (<p>{this.props.upload.message}</p>) : null;

    switch (this.props.upload.status) {
      case client.STATUS.SUCCEEDED:
        return (
          <div>
            <p>
              The program uploaded successfully.
            </p>
            {message}
          </div>
        );
      case client.STATUS.FAILED:
        return (
          <div>
            <p>
              Oops! Error occured.
            </p>
            {message}
          </div>
        );
      default:
        return (
          <div>
            <p>
              Your program is uploading onto device.<br />
              Do not unplug the device.
            </p>
            {message}
          </div>
        );
    }
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
    return (this.props.upload.status === client.STATUS.SUCCEEDED);
  }

  isFailed() {
    return (this.props.upload.status === client.STATUS.FAILED);
  }

  canClose() {
    return (this.isSucceeded() || this.isFailed());
  }

  render() {
    const title = this.getTitle();
    const message = this.getMessage();
    const progress = this.getProgress();
    const color = this.isFailed() ? '#d40000' : '#00d444';
    const closeButtonStyle = this.canClose() ?
      { display: 'inline' } :
      { display: 'none' };

    return (
      <SkyLightStateless
        dialogStyles={{ height: 'auto' }}
        isVisible={this.props.isVisible}
        title={title}
        closeButtonStyle={closeButtonStyle}
        onCloseClicked={this.onClose}
        onOverlayClicked={this.onClose}
      >
        <ProgressBar percent={progress} strokeWidth="4" strokeColor={color} />
        {message}
      </SkyLightStateless>
    );
  }
}

PopupUploadProject.propTypes = {
  upload: React.PropTypes.object,
  isVisible: React.PropTypes.bool,
  onClose: React.PropTypes.func,
};

PopupUploadProject.defaultProps = {
  upload: {
    status: client.STATUS.STARTED,
    message: '',
    percentage: 0,
  },
  isVisible: false,
};

export default PopupUploadProject;
