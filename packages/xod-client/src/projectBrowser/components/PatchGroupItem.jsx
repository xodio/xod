import R from 'ramda';
import React from 'react';
import cn from 'classnames';
import 'font-awesome/scss/font-awesome.scss';

const PatchGroupItem = (props) => {
  const {
    label,
    isSelected,
    isOpen,
    className,
    hoverButtons,
  } = props;
  const restProps = R.omit(['label', 'isSelected', 'isOpen', 'hoverButtons', 'contextActions'], props);

  const classNames = cn(
    'PatchGroupItem',
    className,
    {
      isSelected,
      isOpen,
    }
  );

  return (
    <div {...restProps} className={classNames} alt={label}>
      <div className="PatchGroupItem__label">
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
  label: React.PropTypes.string.isRequired,
  isSelected: React.PropTypes.bool,
  isOpen: React.PropTypes.bool,
  className: React.PropTypes.string,
  hoverButtons: React.PropTypes.array,
};

export default PatchGroupItem;
