import { propOr } from 'ramda';
import React from 'react';
import SkyLight from 'react-skylight';

const getForce = propOr(false, 'force');
const getPath = propOr('', 'path');

class PopupCreateWorkspace extends React.Component {
  constructor(props) {
    super(props);
    this.popup = null;
    this.assignPopupRef = this.assignPopupRef.bind(this);
    this.onCreateWorkspace = this.onCreateWorkspace.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.isVisible) {
      this.show();
    } else {
      this.hide();
    }
  }

  onCreateWorkspace() {
    this.props.onCreateWorkspace(getPath(this.props.data));
  }

  getContent() {
    return (getForce(this.props.data)) ? (
      <div>
        <p>
          <strong>{getPath(this.props.data)} is not empty.</strong>
          <br />
          Create workspace anyway?
        </p>
      </div>
    ) : (
      <div>
        <p>
          Create new workspace in {getPath(this.props.data)}?
        </p>
      </div>
    );
  }

  getButtonCaption() {
    return (getForce(this.props.data)) ? 'Create, force' : 'Create';
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
        isClosable={false}
        ref={this.assignPopupRef}
        title="New workspace"
      >
        <div className="ModalBody">
          <div className="ModalContent">
            {this.getContent()}
          </div>
          <div className="ModalFooter">
            <button
              className="Button"
              onClick={this.onCreateWorkspace}
            >
              {this.getButtonCaption()}
            </button>
            <button
              className="Button"
              onClick={this.props.onClose}
            >
              Change location
            </button>
          </div>
        </div>
      </SkyLight>
    );
  }
}

PopupCreateWorkspace.propTypes = {
  isVisible: React.PropTypes.bool, // eslint-disable-line
  data: React.PropTypes.object,
  onCreateWorkspace: React.PropTypes.func,
  onClose: React.PropTypes.func,
};

export default PopupCreateWorkspace;
