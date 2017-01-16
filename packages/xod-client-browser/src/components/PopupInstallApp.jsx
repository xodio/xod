import React from 'react';
import SkyLight from 'react-skylight';

class PopupInstallApp extends React.Component {
  constructor(props) {
    super(props);

    this.popup = null;
    this.assignPopupRef = this.assignPopupRef.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    if (!this.props.isVisible && nextProps.isVisible) {
      this.show();
    }
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
