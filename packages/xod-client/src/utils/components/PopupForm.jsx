import React from 'react';
import classNames from 'classnames';
import { SkyLightStateless } from 'react-skylight';
import EventListener from 'react-event-listener';

import { noop } from '../../utils/ramda';
import { KEYCODE } from '../../utils/constants';

const PopupForm = ({ title, children, className, onClose, isClosable, isVisible }) => {
  const wrapperClassNames = classNames('PopupForm', className);
  const onCloseClicked = isClosable ? onClose : noop;

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
        isVisible={isVisible}
        title={title}
        isClosable={isClosable}
        onCloseClicked={onCloseClicked}
        onOverlayClicked={onCloseClicked}
      >
        <div className="ModalBody">
          {children}
        </div>
      </SkyLightStateless>
    </div>
  );
};

PopupForm.propTypes = {
  title: React.PropTypes.string,
  children: React.PropTypes.any,
  className: React.PropTypes.string,
  onClose: React.PropTypes.func,
  isClosable: React.PropTypes.bool,
  isVisible: React.PropTypes.bool,
};
PopupForm.defaultProps = {
  title: 'Fill the form',
  className: '',
  onClose: noop,
  isClosable: true,
  isVisible: true,
};

export default PopupForm;
