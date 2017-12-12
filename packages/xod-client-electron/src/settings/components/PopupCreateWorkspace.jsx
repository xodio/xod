import { propOr } from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { PopupForm } from 'xod-client';

const getForce = propOr(false, 'force');
const getPath = propOr('', 'path');

class PopupCreateWorkspace extends React.Component {
  onCreateWorkspace = () => {
    this.props.onCreateWorkspace(getPath(this.props.data));
  };

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

  render() {
    return (
      <PopupForm
        isVisible={this.props.isVisible}
        isClosable={false}
        title="New workspace"
      >
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
      </PopupForm>
    );
  }
}

PopupCreateWorkspace.propTypes = {
  isVisible: PropTypes.bool,
  data: PropTypes.object,
  onCreateWorkspace: PropTypes.func,
  onClose: PropTypes.func,
};

export default PopupCreateWorkspace;
