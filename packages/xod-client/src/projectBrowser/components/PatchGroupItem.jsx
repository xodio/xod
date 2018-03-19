import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { DragSource } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Icon } from 'react-fa';
import { ContextMenuTrigger } from 'react-contextmenu';

import { PATCH_GROUP_CONTEXT_MENU_ID } from '../constants';
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

const deadIcon = (
  <Icon
    key="dead-patch-icon"
    className="dead-patch-icon"
    name="warning"
    title="Patch contains errors"
  />
);
const deprecatedIcon = (
  <span className="deprecated-patch-icon" title="Patch deprecated" />
);

class PatchGroupItem extends React.Component {
  componentDidMount() {
    // Use empty image as a drag preview so browsers don't draw it
    // and we can draw whatever we want on the custom drag layer instead.
    this.props.connectDragPreview(getEmptyImage());
  }

  shouldComponentUpdate(nextProps) {
    return !R.eqBy(
      R.pick([
        'label',
        'patchPath',
        'dead',
        'isSelected',
        'isOpen',
        'className',
      ]),
      nextProps,
      this.props
    );
  }

  render() {
    const {
      label,
      isSelected,
      isOpen,
      dead,
      deprecated,
      className,
      hoverButtons,
      onClick,
      onDoubleClick,
      connectDragSource,
      collectPropsFn,
      ...restProps
    } = this.props;

    const classNames = cn('PatchGroupItem', className, {
      isSelected,
      isOpen,
    });

    return connectDragSource(
      <div // eslint-disable-line jsx-a11y/no-static-element-interactions
        role="button"
        data-id={label}
        className={classNames}
        onClick={onClick}
        onContextMenuCapture={onClick}
        {...R.omit(
          ['patchPath', 'onBeginDrag', 'connectDragPreview', 'dead'],
          restProps
        )}
      >
        <ContextMenuTrigger
          id={PATCH_GROUP_CONTEXT_MENU_ID}
          holdToDisplay={-1}
          collect={collectPropsFn}
        >
          <div // eslint-disable-line jsx-a11y/no-static-element-interactions
            className="PatchGroupItem__label"
            onDoubleClick={onDoubleClick}
            role="button"
          >
            {dead ? deadIcon : null}
            {deprecated ? deprecatedIcon : null}
            {label}
          </div>
        </ContextMenuTrigger>
        <div className="PatchGroupItem__hover-buttons">{hoverButtons}</div>
      </div>
    );
  }
}

PatchGroupItem.propTypes = {
  label: PropTypes.string.isRequired,
  patchPath: PropTypes.string.isRequired,
  dead: PropTypes.bool,
  deprecated: PropTypes.bool,
  isSelected: PropTypes.bool,
  isOpen: PropTypes.bool,
  className: PropTypes.string,
  hoverButtons: PropTypes.array,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  connectDragSource: PropTypes.func.isRequired,
  connectDragPreview: PropTypes.func.isRequired,
  onBeginDrag: PropTypes.func.isRequired,
  collectPropsFn: PropTypes.func.isRequired,
};

// eslint-disable-next-line new-cap
export default DragSource(DRAGGED_ENTITY_TYPE.PATCH, dragSource, collect)(
  PatchGroupItem
);
