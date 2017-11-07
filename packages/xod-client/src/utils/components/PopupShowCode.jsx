import React from 'react';
import PropTypes from 'prop-types';
import SkyLight from 'react-skylight';

class PopupShowCode extends React.Component {
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
        className="skylight-dialog--fullscreen"
        hideOnOverlayClicked
        ref={this.assignPopupRef}
        title="Transpiled code"
        afterClose={this.props.onClose}
      >
        <div className="CodeboxModalContent">
          <textarea className="Codebox" value={this.props.code} readOnly />
          <div className="ModalBody ModalBody--light">
            <div className="ModalFooter">
              This code could be uploaded onto your device.<br />
              Just connect your device via USB and click on &quot;Upload&quot;
              button.
            </div>
          </div>
        </div>
      </SkyLight>
    );
  }
}

PopupShowCode.defaultProps = {
  isVisible: false,
  code: '',
};

PopupShowCode.propTypes = {
  isVisible: PropTypes.bool,
  code: PropTypes.string,
  onClose: PropTypes.func,
};

export default PopupShowCode;
