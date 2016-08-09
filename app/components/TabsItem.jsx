import React from 'react';
import classNames from 'classnames';

const TabsItem = ({ data, onClick }) => {
  const classes = classNames('TabsItem', {
    'is-active': data.isActive,
  });

  const handleClick = () => onClick(data.patchId);

  return (
    <li
      className={classes}
      onClick={handleClick}
    >
      {data.name} ({data.id} / {data.patchId})
    </li>
  );
};

TabsItem.propTypes = {
  data: React.PropTypes.shape({
    id: React.PropTypes.number,
    patchId: React.PropTypes.number,
    index: React.PropTypes.number,
    name: React.PropTypes.string,
    isActive: React.PropTypes.boolean,
  }),
  onClick: React.PropTypes.func,
};

export default TabsItem;
