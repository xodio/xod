import React from 'react';
import { Icon } from 'react-fa';

const UserButton = ({ username, onClick }) => (
  <button
    className="UserButton"
    onClick={onClick}
  >
    <Icon name="user" />
    {username}
  </button>
);

UserButton.propTypes = {
  username: React.PropTypes.string.isRequired,
  onClick: React.PropTypes.func.isRequired,
};

export default UserButton;
