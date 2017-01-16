import React from 'react';
import classNames from 'classnames';
import { Icon } from 'react-fa';

const UserMenu = ({ opened, buttons }) => {
  const classnames = classNames('UserMenu', {
    'is-opened': opened,
  });

  const buttonsRenderer = (button, i) => {
    const icon = (button.icon) ? <Icon name={button.icon} /> : null;
    const disabled = (button.active !== undefined) ? !button.active : false;
    return (
      <li key={i}>
        <button
          className="UserMenu-button UserMenu-button-{button.name}"
          disabled={disabled}
          onClick={button.onClick}
        >
          {icon}
          {button.text}
        </button>
      </li>
    );
  };

  return (
    <ul className={classnames}>
      {buttons.map(buttonsRenderer)}
    </ul>
  );
};

UserMenu.propTypes = {
  opened: React.PropTypes.bool,
  buttons: React.PropTypes.array,
};

UserMenu.defaultProps = {
  opened: false,
  buttons: [],
};

export default UserMenu;
