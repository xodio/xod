import React from 'react';
import { Icon } from 'react-fa';

export const LoginButton = ({ onClick }) => (
  <button
    className="LoginButton"
    onClick={onClick}
  >
    <Icon name="sign-in" />
    Sign in
  </button>
);

LoginButton.propTypes = {
  onClick: React.PropTypes.func,
};
