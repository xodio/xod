import React from 'react';
import cn from 'classnames';
import PropTypes from 'prop-types';

const Button = ({
  as = 'button',
  className,
  disabled,
  light,
  small,
  children,
  ...restProps
}) =>
  React.createElement(
    as,
    {
      ...restProps,
      className: cn('Button', className, {
        'Button--light': light,
        'Button--small': small,
        disabled,
      }),
      disabled,
      role: as !== 'button' ? 'button' : restProps.role,
    },
    children
  );

Button.propTypes = {
  as: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  light: PropTypes.bool,
  small: PropTypes.bool,
  children: PropTypes.node,
};

export default Button;
