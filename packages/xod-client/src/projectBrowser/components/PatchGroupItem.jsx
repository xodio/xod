import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { DragSource } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Icon } from 'react-fa';
import 'font-awesome/scss/font-awesome.scss';

import { DRAGGED_ENTITY_TYPE } from '../../editor/constants';

const dragSource = {
  beginDrag(props) {
    props.onBeginDrag(props.patchPath);
    return { patchPath: props.patchPath };
  },
};

const collect = connect => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
});

class PatchGroupItem extends React.PureComponent {
  componentDidMount() {
    // Use empty image as a drag preview so browsers don't draw it
    // and we can draw whatever we want on the custom drag layer instead.
    this.props.connectDragPreview(getEmptyImage());
  }

  render() {
    const {
      label,
      isSelected,
      isOpen,
      dead,
      className,
      hoverButtons,
      onClick,
      onDoubleClick,
      connectDragSource,
      ...restProps
    } = this.props;

    const classNames = cn(
      'PatchGroupItem',
      className,
      {
        isSelected,
        isOpen,
      }
    );

    const deadIcon = (dead) ? (
      <Icon
        className="dead-patch-icon"
        name="warning"
        title="Patch contains dead references"
      />
    ) : null;

    return connectDragSource(
      <div
        title={label}
        className={classNames}
        {...R.omit(['patchPath', 'onBeginDrag', 'connectDragPreview', 'dead'], restProps)}
      >
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
          className="PatchGroupItem__label"
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          role="button"
        >
          {deadIcon}
          {label}
        </div>
        <div className="PatchGroupItem__hover-buttons">
          {hoverButtons}
          {/* placeholder for context menu opener */}
          {/* <i className="fa fa-bars" /> */}
        </div>
      </div>
    );
  }
}

PatchGroupItem.propTypes = {
  label: PropTypes.string.isRequired,
  patchPath: PropTypes.string.isRequired,
  dead: PropTypes.bool,
  isSelected: PropTypes.bool,
  isOpen: PropTypes.bool,
  className: PropTypes.string,
  hoverButtons: PropTypes.array,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  connectDragSource: PropTypes.func.isRequired,
  connectDragPreview: PropTypes.func.isRequired,
  onBeginDrag: PropTypes.func.isRequired,
};

export default DragSource( // eslint-disable-line new-cap
  DRAGGED_ENTITY_TYPE.PATCH,
  dragSource,
  collect
)(PatchGroupItem);
