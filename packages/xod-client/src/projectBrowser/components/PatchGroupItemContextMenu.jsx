import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu';

import { PATCH_GROUP_CONTEXT_MENU_ID } from '../constants';

const onContextMenuItemClick = onClick => (event, data) => {
  onClick(data.patchPath);

  // Need to force focus on Editor to provide use of its hotkeys
  // Cause after click ContextMenu will be unmounted and focus
  // automatically switches to <body> element.
  document.getElementById('Editor').focus();
};

const PatchGroupItemContextMenu = (props) => {
  const trigger = (props.trigger) ? props.trigger : {};

  const renamePatch = (trigger.isLocalPatch)
    ? (
      <MenuItem
        onClick={onContextMenuItemClick(props.onPatchRename)}
        // data-id has special attribute that used by func tests
        attributes={{ 'data-id': 'rename' }}
      >
        Rename
      </MenuItem>
    ) : null;

  const deletePatch = (trigger.isLocalPatch)
    ? (
      <MenuItem
        onClick={onContextMenuItemClick(props.onPatchDelete)}
        attributes={{ 'data-id': 'delete' }}
      >
        Delete
      </MenuItem>
    ) : null;

  const cls = cn('ContextMenu ContextMenu--PatchGroupItem', {
    // It's a hack to prevent rendering contextmenu
    // after click something with wrong menu items
    'ContextMenu--hide': !props.trigger,
  });

  return (
    <ContextMenu
      id={PATCH_GROUP_CONTEXT_MENU_ID}
      className={cls}
    >
      <MenuItem
        onClick={onContextMenuItemClick(props.onPatchAdd)}
        disabled={!trigger.canAdd}
        attributes={{ 'data-id': 'place' }}
      >
        <span className="accelerator">
          drag&drop
        </span>
        Place
      </MenuItem>
      <MenuItem divider />
      <MenuItem
        onClick={onContextMenuItemClick(props.onPatchOpen)}
        attributes={{ 'data-id': 'open' }}
      >
        <span className="accelerator">
          click&times;2
        </span>
        Open
      </MenuItem>
      {renamePatch}
      {deletePatch}
      <MenuItem divider />
      <MenuItem
        onClick={onContextMenuItemClick(props.onPatchHelp)}
        attributes={{ 'data-id': 'help' }}
      >
        <span className="accelerator">
          h
        </span>
        Help
      </MenuItem>
    </ContextMenu>
  );
};

PatchGroupItemContextMenu.propTypes = {
  trigger: PropTypes.shape({
    /* eslint-disable react/no-unused-prop-types */
    patchPath: PropTypes.string.isRequired,
    canAdd: PropTypes.bool.isRequired,
    isLocalPatch: PropTypes.bool.isRequired,
    /* eslint-enable react/no-unused-prop-types */
  }),
  onPatchAdd: PropTypes.func.isRequired,
  onPatchOpen: PropTypes.func.isRequired,
  onPatchDelete: PropTypes.func.isRequired,
  onPatchRename: PropTypes.func.isRequired,
  onPatchHelp: PropTypes.func.isRequired,
};

export default connectMenu(PATCH_GROUP_CONTEXT_MENU_ID)(PatchGroupItemContextMenu);
