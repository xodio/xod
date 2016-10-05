import React from 'react';
import classNames from 'classnames';
import { SkyLightStateless } from 'react-skylight';
import { noop } from '../../utils/ramda';

import EventListener from 'react-event-listener';
import { KEYCODE } from '../../utils/constants';

const PopupAlert = ({ title, children, closeText, className, onClose, isModal, isVisible }) => {
  const wrapperClassNames = classNames('PopupAlert', className);
  const onCloseClicked = (!isModal) ? onClose : noop;
  const closeButtonStyle = (isModal) ?
    { display: 'none' } :
    { display: 'inline' };

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
        <div className="PopupContent">
          {children}
        </div>
        <div className="PopupButtons">
          <button
            className="PopupButton-Primary"
            onClick={onClose}
            autoFocus
          >
            {closeText}
          </button>
        </div>
      </SkyLightStateless>
    </div>
  );
};

PopupAlert.propTypes = {
  title: React.PropTypes.string,
  children: React.PropTypes.any,
  closeText: React.PropTypes.string,
  className: React.PropTypes.string,
  onClose: React.PropTypes.func,
  isModal: React.PropTypes.bool,
  isVisible: React.PropTypes.bool,
};
PopupAlert.defaultProps = {
  title: 'Alert!',
  closeText: 'Okay',
  className: '',
  onClose: noop,
  isModal: false,
  isVisible: true,
};

export default PopupAlert;
