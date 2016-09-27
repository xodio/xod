import React from 'react';
import SkyLight from 'react-skylight';

class PopupInstallApp extends React.Component {
  componentWillReceiveProps(nextProps) {
    if (nextProps.isVisible) {
      this.show();
    }
  }
  show() {
    this.refs.popup.show();
  }
  hide() {
    this.refs.popup.hide();
  }
  render() {
    return (
      <SkyLight
        hideOnOverlayClicked
        dialogStyles={{
          height: 'auto',
        }}
        ref="popup"
        title="Oops! You need a Chrome App!"
        onCloseClicked={this.props.onClose}
        onOverlayClicked={this.props.onClose}
      >
        <p>
          To use this feature you have to install a Chrome Application.<br />
          It's free.
        </p>
        <p>
          <a href="#">Open in Chrome Store</a>
        </p>
      </SkyLight>
    );
  }
}

PopupInstallApp.propTypes = {
  isVisible: React.PropTypes.bool,
  onClose: React.PropTypes.func,
};

export default PopupInstallApp;
