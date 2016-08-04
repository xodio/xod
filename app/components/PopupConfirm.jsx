import React from 'react';
import classNames from 'classnames';
import { SkyLightStateless } from 'react-skylight';

const PopupConfirm = ({
  title,
  children,
  confirmText,
  cancelText,
  className,
  onConfirm,
  onClose,
  isModal,
  isVisible,
}) => {
  const wrapperClassNames = classNames('PopupConfirm', className);
  const onCloseClicked = (!isModal) ? onClose : f => f;
  const closeButtonStyle = (isModal) ?
    { display: 'none' } :
    { display: 'inline' };

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
        <div className="PopupContent">
          {children}
        </div>
        <div className="PopupButtons">
          <button
            className="PopupButton-Secondary"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className="PopupButton-Primary"
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </SkyLightStateless>
    </div>
  );
};

PopupConfirm.propTypes = {
  title: React.PropTypes.string,
  children: React.PropTypes.any,
  confirmText: React.PropTypes.string,
  cancelText: React.PropTypes.string,
  className: React.PropTypes.string,
  onClose: React.PropTypes.func,
  onConfirm: React.PropTypes.func,
  isModal: React.PropTypes.bool,
  isVisible: React.PropTypes.bool,
};
PopupConfirm.defaultProps = {
  title: 'We have a question...',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  className: '',
  onClose: f => f,
  onConfirm: f => f,
  isModal: false,
  isVisible: true,
};

export default PopupConfirm;
