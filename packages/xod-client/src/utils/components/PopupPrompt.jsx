import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { SkyLightStateless } from 'react-skylight';
import EventListener from 'react-event-listener';

import { noop } from '../../utils/ramda';
import { KEYCODE } from '../../utils/constants';
import deepSCU from '../deepSCU';

class PopupPrompt extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inputValue: '',
    };

    this.shouldComponentUpdate = deepSCU.bind(this);
  }

  onCloseClicked = () => {
    if (this.props.isClosable) {
      this.props.onClose();
    }
  };

  onDocumentKeyDown = (event) => {
    if (!this.props.isVisible) return;

    const keycode = event.keycode || event.which;
    if (keycode === KEYCODE.ESCAPE) {
      this.onCloseClicked();
    }
  };

  onInputChange = (event) => {
    const inputValue = this.props.inputMask(event.target.value);

    this.setState({ inputValue });
  };

  onSubmit = (event) => {
    event.preventDefault();

    if (!this.isInputValid() || this.state.inputValue === '') {
      return false;
    }

    return this.props.onConfirm(this.state.inputValue);
  };

  isInputValid = () => this.props.inputValidator(this.state.inputValue);

  render() {
    const {
      title,
      helpText,
      children,
      confirmText,
      cancelText,
      className,
      onClose,
      inputType,
      isClosable,
      isVisible,
    } = this.props;

    const wrapperClassNames = classNames('PopupPrompt', className);

    const isValid = this.isInputValid();
    const inputClassNames = classNames('inspectorTextInput', 'inspectorInput--full-width', {
      invalid: !isValid && this.state.inputValue !== '',
    });
    const isSubmitDisabled = !isValid || this.state.inputValue === '';

    return (
      <div className={wrapperClassNames}>
        <EventListener target={document} onKeyDown={this.onDocumentKeyDown} />
        <SkyLightStateless
          isVisible={isVisible}
          title={title}
          isClosable={isClosable}
          onCloseClicked={this.onCloseClicked}
          onOverlayClicked={this.onCloseClicked}
        >
          <form onSubmit={this.onSubmit}>
            <div className="ModalBody">
              <div className="ModalContent">
                {children}
                <input
                  className={inputClassNames}
                  type={inputType}
                  value={this.state.inputValue}
                  onChange={this.onInputChange}
                  autoFocus
                />
                <p className="helpText">{helpText}</p>
              </div>
              <div className="ModalFooter">
                <button
                  type="submit"
                  className="Button Button--primary"
                  disabled={isSubmitDisabled}
                >
                  {confirmText}
                </button>
                <button
                  className="Button"
                  onClick={onClose}
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </form>
        </SkyLightStateless>
      </div>
    );
  }
}

PopupPrompt.propTypes = {
  title: PropTypes.string,
  helpText: PropTypes.string,
  children: PropTypes.any,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  className: PropTypes.string,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  inputMask: PropTypes.func,
  inputValidator: PropTypes.func,
  inputType: PropTypes.string,
  isClosable: PropTypes.bool,
  isVisible: PropTypes.bool,
};

PopupPrompt.defaultProps = {
  title: 'We have a question...',
  helpText: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  className: '',
  onClose: noop,
  onConfirm: noop,
  inputMask: R.identity,
  inputValidator: R.T,
  inputType: 'text',
  isClosable: true,
  isVisible: true,
};

export default PopupPrompt;
