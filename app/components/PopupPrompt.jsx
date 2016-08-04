import React from 'react';
import classNames from 'classnames';
import { SkyLightStateless } from 'react-skylight';

const PopupPrompt = ({
  title,
  children,
  confirmText,
  cancelText,
  className,
  onConfirm,
  onClose,
  onKeyDown,
  inputType,
  isModal,
  isVisible,
}) => {
  const wrapperClassNames = classNames('PopupPrompt', className);
  const onCloseClicked = (!isModal) ? onClose : f => f;
  const closeButtonStyle = (isModal) ?
    { display: 'none' } :
    { display: 'inline' };

  const onSubmit = (event) => {
    event.preventDefault();
    const formElements = event.target.elements;
    const value = formElements.answer.value;

    return onConfirm(value);
  };

  return (
    <div className={wrapperClassNames}>
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
              <input name="answer" type={inputType} onKeyDown={onKeyDown} autoFocus />
            </div>
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
  children: React.PropTypes.any,
  confirmText: React.PropTypes.string,
  cancelText: React.PropTypes.string,
  className: React.PropTypes.string,
  onClose: React.PropTypes.func,
  onConfirm: React.PropTypes.func,
  onKeyDown: React.PropTypes.func,
  inputType: React.PropTypes.string,
  isModal: React.PropTypes.bool,
  isVisible: React.PropTypes.bool,
};
PopupPrompt.defaultProps = {
  title: 'We have a question...',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  className: '',
  onClose: f => f,
  onConfirm: f => f,
  onKeyDown: f => f,
  inputType: 'text',
  isModal: false,
  isVisible: true,
};

export default PopupPrompt;
