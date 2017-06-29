import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { SkyLightStateless } from 'react-skylight';
import EventListener from 'react-event-listener';

import { noop } from '../../utils/ramda';
import { KEYCODE } from '../../utils/constants';

const PopupConfirm = ({
  title,
  children,
  confirmText,
  cancelText,
  className,
  onConfirm,
  onClose,
  isClosable,
  isVisible,
}) => {
  const wrapperClassNames = classNames('PopupConfirm', className);
  const onCloseClicked = isClosable ? onClose : noop;

  const onKeyDown = (event) => {
    if (!isVisible) return;

    const keycode = event.keycode || event.which;
    if (keycode === KEYCODE.ESCAPE) {
      onCloseClicked();
    }
  };

  return (
    <div className={wrapperClassNames}>
      <EventListener target={document} onKeyDown={onKeyDown} />
      <SkyLightStateless
        isVisible={isVisible}
        title={title}
        isClosable={isClosable}
        onCloseClicked={onCloseClicked}
        onOverlayClicked={onCloseClicked}
      >
        <div className="ModalBody">
          <div className="ModalContent">
            {children}
          </div>
          <div className="ModalFooter">
            <button
              className="Button Button--primary"
              onClick={onConfirm}
              autoFocus
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
      </SkyLightStateless>
    </div>
  );
};

PopupConfirm.propTypes = {
  title: PropTypes.string,
  children: PropTypes.any,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  className: PropTypes.string,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  isClosable: PropTypes.bool,
  isVisible: PropTypes.bool,
};
PopupConfirm.defaultProps = {
  title: 'We have a question...',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  className: '',
  onClose: noop,
  onConfirm: noop,
  isClosable: true,
  isVisible: true,
};

export default PopupConfirm;
