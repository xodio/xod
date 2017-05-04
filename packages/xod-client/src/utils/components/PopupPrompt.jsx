import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import { SkyLightStateless } from 'react-skylight';
import EventListener from 'react-event-listener';

import { noop } from '../../utils/ramda';
import { KEYCODE } from '../../utils/constants';

class PopupPrompt extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inputValue: '',
    };

    this.onCloseClicked = this.onCloseClicked.bind(this);
    this.onDocumentKeyDown = this.onDocumentKeyDown.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.isInputValid = this.isInputValid.bind(this);
  }

  onCloseClicked() {
    if (!this.props.isModal) {
      this.props.onClose();
    }
  }

  onDocumentKeyDown(event) {
    const keycode = event.keycode || event.which;
    if (keycode === KEYCODE.ESCAPE) {
      this.onCloseClicked();
    }
  }

  onInputChange(event) {
    const inputValue = this.props.inputMask(event.target.value);

    this.setState({ inputValue });
  }

  onSubmit(event) {
    event.preventDefault();

    if (!this.isInputValid() || this.state.inputValue === '') {
      return false;
    }

    return this.props.onConfirm(this.state.inputValue);
  }

  isInputValid() {
    return this.props.inputValidator(this.state.inputValue);
  }

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
      isModal,
      isVisible,
    } = this.props;

    const wrapperClassNames = classNames('PopupPrompt', className);
    const closeButtonStyle = (isModal) ?
      { display: 'none' } :
      { display: 'inline' };

    const isValid = this.isInputValid();
    const inputClassNames = classNames({
      invalid: !isValid && this.state.inputValue !== '',
    });
    const isSubmitDisabled = !isValid || this.state.inputValue === '';

    return (
      <div className={wrapperClassNames}>
        <EventListener target={document} onKeyDown={this.onDocumentKeyDown} />
        <SkyLightStateless
          dialogStyles={{ height: 'auto' }}
          isVisible={isVisible}
          title={title}
          closeButtonStyle={closeButtonStyle}
          onCloseClicked={this.onCloseClicked}
          onOverlayClicked={this.onCloseClicked}
        >
          <form onSubmit={this.onSubmit}>
            <div className="PopupContent">
              {children}
              <div className="PopupFields">
                <input
                  className={inputClassNames}
                  type={inputType}
                  value={this.state.inputValue}
                  onChange={this.onInputChange}
                  autoFocus
                />
              </div>
              <span className="helpText">{helpText}</span>
            </div>
            <div className="PopupButtons">
              <button
                type="button"
                className="PopupButton-Secondary"
                onClick={onClose}
              >
                {cancelText}
              </button>
              <button
                type="submit"
                className="PopupButton-Primary"
                disabled={isSubmitDisabled}
              >
                {confirmText}
              </button>
            </div>
          </form>
        </SkyLightStateless>
      </div>
    );
  }
}

PopupPrompt.propTypes = {
  title: React.PropTypes.string,
  helpText: React.PropTypes.string,
  children: React.PropTypes.any,
  confirmText: React.PropTypes.string,
  cancelText: React.PropTypes.string,
  className: React.PropTypes.string,
  onClose: React.PropTypes.func,
  onConfirm: React.PropTypes.func,
  inputMask: React.PropTypes.func,
  inputValidator: React.PropTypes.func,
  inputType: React.PropTypes.string,
  isModal: React.PropTypes.bool,
  isVisible: React.PropTypes.bool,
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
  isModal: false,
  isVisible: true,
};

export default PopupPrompt;
