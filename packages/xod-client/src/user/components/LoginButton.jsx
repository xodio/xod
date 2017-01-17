import React from 'react';
import { Icon } from 'react-fa';

const LoginButton = ({ onClick }) => (
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

export default LoginButton;
