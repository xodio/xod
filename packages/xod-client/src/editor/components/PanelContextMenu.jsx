import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu';

import { PANEL_CONTEXT_MENU_ID, PANEL_IDS, SIDEBAR_IDS } from '../constants';

const callCallbackWithPanelId = onClick => (event, data) => onClick(data.panelId);

const PanelContextMenu = (props) => {
  const trigger = (props.trigger) ? props.trigger : {};
  const cls = cn('ContextMenu ContextMenu--Sidebar', {
    // It's a hack to prevent rendering contextmenu
    // after click something with wrong menu items
    'ContextMenu--hide': !props.trigger,
  });

  const callSwitchSideClick = R.curry(
    (sidebarId, panelId) => props.onSwitchSideClick(sidebarId, panelId)
  );

  return (
    <ContextMenu
      id={PANEL_CONTEXT_MENU_ID}
      className={cls}
    >
      <MenuItem
        onClick={callCallbackWithPanelId(props.onMinimizeClick)}
        attributes={{ 'data-id': 'minimize' }}
      >
        Minimize
      </MenuItem>
      {(trigger.sidebarId === SIDEBAR_IDS.LEFT) ? (
        <MenuItem
          onClick={callCallbackWithPanelId(callSwitchSideClick(SIDEBAR_IDS.RIGHT))}
          attributes={{ 'data-id': 'move-to-right' }}
        >
          Dock to Right
        </MenuItem>
      ) : (
        <MenuItem
          onClick={callCallbackWithPanelId(callSwitchSideClick(SIDEBAR_IDS.LEFT))}
          attributes={{ 'data-id': 'move-to-left' }}
        >
          Dock to Left
        </MenuItem>
      )}
      {/* TODO */}
      {/* <MenuItem
        onClick={callCallbackWithPanelId(props.onAutohideClick)}
        attributes={{ 'data-id': 'toggle-autohide' }}
      >
        <span className="state">
          {(trigger.autohide) ? '✔︎' : '✘'}
        </span>
        Autohide
      </MenuItem> */}
    </ContextMenu>
  );
};

PanelContextMenu.propTypes = {
  trigger: PropTypes.shape({
    /* eslint-disable react/no-unused-prop-types */
    panelId: PropTypes.oneOf(R.values(PANEL_IDS)).isRequired,
    sidebarId: PropTypes.oneOf(R.values(SIDEBAR_IDS)),
    autohide: PropTypes.bool.isRequired,
    /* eslint-enable react/no-unused-prop-types */
  }),
  onMinimizeClick: PropTypes.func.isRequired,
  onSwitchSideClick: PropTypes.func.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  onAutohideClick: PropTypes.func.isRequired, // TODO
};

export default connectMenu(PANEL_CONTEXT_MENU_ID)(PanelContextMenu);
