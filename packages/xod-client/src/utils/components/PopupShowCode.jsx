import React from 'react';
import SkyLight from 'react-skylight';

class PopupShowCode extends React.Component {
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
        title="Transpiled code:"
        afterClose={this.props.onClose}
      >
        <textarea
          className="PopupShowCode-codebox"
          value={this.props.code}
          readOnly
        />
        <p>
          This code could be uploaded onto your device.<br />
          Just connect your device via USB and click on "Upload" button.
        </p>
      </SkyLight>
    );
  }
}

PopupShowCode.defaultProps = {
  isVisible: false,
  code: '',
};

PopupShowCode.propTypes = {
  isVisible: React.PropTypes.bool,
  code: React.PropTypes.string,
  onClose: React.PropTypes.func,
};

export default PopupShowCode;
