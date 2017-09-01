import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import 'font-awesome/scss/font-awesome.scss';

const PatchGroupItem = (props) => {
  const {
    label,
    isSelected,
    isOpen,
    className,
    hoverButtons,
    onClick,
    onDoubleClick,
    ...restProps
  } = props;

  const classNames = cn(
    'PatchGroupItem',
    className,
    {
      isSelected,
      isOpen,
    }
  );

  return (
    <div {...restProps} className={classNames} title={label}>
      <div // eslint-disable-line jsx-a11y/no-static-element-interactions
        className="PatchGroupItem__label"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        role="button"
      >
        {label}
      </div>
      <div className="PatchGroupItem__hover-buttons">
        {hoverButtons}
        {/* placeholder for context menu opener */}
        {/* <i className="fa fa-bars" /> */}
      </div>
    </div>
  );
};

PatchGroupItem.displayName = 'PatchGroupItem';

PatchGroupItem.propTypes = {
  label: PropTypes.string.isRequired,
  isSelected: PropTypes.bool,
  isOpen: PropTypes.bool,
  className: PropTypes.string,
  hoverButtons: PropTypes.array,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
};

export default PatchGroupItem;
