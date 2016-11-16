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
        title="Oops! You need a desktop IDE!"
        afterClose={this.props.onClose}
      >
        <p>
          To upload projects you need to install XOD IDE for desktop.
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
