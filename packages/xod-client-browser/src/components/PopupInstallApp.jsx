import React from 'react';
import PropTypes from 'prop-types';
import SkyLight from 'react-skylight';

import { getUtmSiteUrl } from 'xod-client';

class PopupInstallApp extends React.PureComponent {
  constructor(props) {
    super(props);

    this.popup = null;
    this.assignPopupRef = this.assignPopupRef.bind(this);
    this.hide = this.hide.bind(this);
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
      this.props.onClose();
    }
  }

  assignPopupRef(ref) {
    this.popup = ref;
  }

  render() {
    return (
      <SkyLight
        hideOnOverlayClicked
        ref={this.assignPopupRef}
        title="You need the desktop version of XOD IDE"
        afterClose={this.props.onClose}
      >
        <div className="ModalBody">
          <div className="ModalContent">
            Uploading a program requires access to USB ports. <br />
            Browsers do not provide it for security reasons,&nbsp;
            so you have to install more permissive IDE for the desktop.
          </div>
          <div className="ModalFooter">
            <a
              href={getUtmSiteUrl('/downloads', 'download', 'upload_dialog')}
              target="_blank"
              rel="noopener noreferrer"
              className="Button"
            >
              Download
            </a>
            <button
              onClick={this.hide}
              className="Button"
            >
              Cancel
            </button>
          </div>
        </div>
      </SkyLight>
    );
  }
}

PopupInstallApp.propTypes = {
  isVisible: PropTypes.bool,
  onClose: PropTypes.func,
};

export default PopupInstallApp;
