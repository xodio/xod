import React from 'react';
import classNames from 'classnames';

const TabsItem = ({ data, onClick, onClose }) => {
  const classes = classNames('TabsItem', {
    'is-active': data.isActive,
  });

  const handleClick = () => onClick(data.patchId);
  const handleClose = (event) => {
    event.stopPropagation();
    onClose(data.id);
  };

  return (
    <li
      className={classes}
      onMouseDown={handleClick}
    >
      <span className="tab-name">
        {data.label}
      </span>
      <span
        className="tab-close"
        onMouseDown={handleClose}
      >
        &times;
      </span>
    </li>
  );
};

const TabsDataPropType = React.PropTypes.shape({
  id: React.PropTypes.string,
  patchId: React.PropTypes.string,
  index: React.PropTypes.number,
  label: React.PropTypes.string,
  isActive: React.PropTypes.boolean,
});

TabsItem.propTypes = {
  data: TabsDataPropType,
  onClick: React.PropTypes.func,
  onClose: React.PropTypes.func,
};

export default TabsItem;
