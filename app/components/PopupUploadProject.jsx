import React from 'react';
import { SkyLightStateless } from 'react-skylight';
import { Line as ProgressBar } from 'rc-progress';
import * as STATUS from '../constants/statuses';

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
      case STATUS.SUCCEEDED:
        return (
          <div>
            <p>
              Congratulations!<br />
              Your device has been successfully patched!<br />
              Now you can close this window and can continue bringing your ideas to life.
            </p>
            {message}
          </div>
        );
      case STATUS.FAILED:
        return (
          <div>
            <p>
              <strong>Oops! Error occured.</strong>
            </p>
            {message}
          </div>
        );
      default:
        return (
          <div>
            <p>
              Your application is uploading onto your device.<br />
              Please, be patient and don't unplug the device from your PC.
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
        <ProgressBar percent={progress} strokeWidth="4" strokeColor="#ff0000" />
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
    status: STATUS.STARTED,
    message: '',
    percentage: 0,
  },
  isVisible: false,
};

export default PopupUploadProject;
