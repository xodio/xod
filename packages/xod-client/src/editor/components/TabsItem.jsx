import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const TabsItem = ({ data, onClick, onClose }) => {
  const classes = classNames('TabsItem', {
    [`TabsItem--${data.type}`]: true,
    'is-active': data.isActive,
  });

  const handleClick = event => onClick(data.id, event);
  const handleClose = event => {
    event.stopPropagation();
    onClose(data.id);
  };

  return (
    <li className={classes} onMouseDown={handleClick}>
      <span className="tab-name">{data.label}</span>
      <span className="tab-close" onMouseDown={handleClose}>
        &times;
      </span>
    </li>
  );
};

const TabsDataPropType = PropTypes.shape({
  id: PropTypes.string,
  patchPath: PropTypes.string,
  type: PropTypes.string,
  index: PropTypes.number,
  label: PropTypes.string,
  isActive: PropTypes.boolean,
});

TabsItem.propTypes = {
  data: TabsDataPropType,
  onClick: PropTypes.func,
  onClose: PropTypes.func,
};

export default TabsItem;
