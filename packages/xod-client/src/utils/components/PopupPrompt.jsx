import React from 'react';
import classNames from 'classnames';
import { SkyLightStateless } from 'react-skylight';
import EventListener from 'react-event-listener';

import { noop } from '../../utils/ramda';
import { KEYCODE } from '../../utils/constants';

const PopupPrompt = ({
  title,
  helpText,
  children,
  confirmText,
  cancelText,
  className,
  onConfirm,
  onClose,
  onInputKeyDown,
  inputType,
  isModal,
  isVisible,
}) => {
  const wrapperClassNames = classNames('PopupPrompt', className);
  const onCloseClicked = (!isModal) ? onClose : noop;
  const closeButtonStyle = (isModal) ?
    { display: 'none' } :
    { display: 'inline' };

  const onSubmit = (event) => {
    event.preventDefault();
    const formElements = event.target.elements;
    const value = formElements.answer.value;

    return onConfirm(value);
  };

  const onKeyDown = (event) => {
    const keycode = event.keycode || event.which;
    if (keycode === KEYCODE.ESCAPE) {
      onCloseClicked();
    }
  };

  return (
    <div className={wrapperClassNames}>
      <EventListener target={document} onKeyDown={onKeyDown} />
      <SkyLightStateless
        dialogStyles={{ height: 'auto' }}
        isVisible={isVisible}
        title={title}
        closeButtonStyle={closeButtonStyle}
        onCloseClicked={onCloseClicked}
        onOverlayClicked={onCloseClicked}
      >
        <form onSubmit={onSubmit}>
          <div className="PopupContent">
            {children}
            <div className="PopupFields">
              <input name="answer" type={inputType} onKeyDown={onInputKeyDown} autoFocus />
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
            >
              {confirmText}
            </button>
          </div>
        </form>
      </SkyLightStateless>
    </div>
  );
};

PopupPrompt.propTypes = {
  title: React.PropTypes.string,
  helpText: React.PropTypes.string,
  children: React.PropTypes.any,
  confirmText: React.PropTypes.string,
  cancelText: React.PropTypes.string,
  className: React.PropTypes.string,
  onClose: React.PropTypes.func,
  onConfirm: React.PropTypes.func,
  onInputKeyDown: React.PropTypes.func,
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
  onInputKeyDown: noop,
  inputType: 'text',
  isModal: false,
  isVisible: true,
};

export default PopupPrompt;
