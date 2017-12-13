import React from 'react';
import cn from 'classnames';
import PropTypes from 'prop-types';

const CloseButton = ({
  as = 'button',
  className,
  ...restProps
}) => React.createElement(
  as,
  {
    ...restProps,
    className: cn('CloseButton', className),
    role: as !== 'button' ? 'button' : restProps.role,
  }
);

CloseButton.propTypes = {
  as: PropTypes.string,
  className: PropTypes.string,
};

export default CloseButton;
