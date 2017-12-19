import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { ContextMenuTrigger } from 'react-contextmenu';
import CustomScroll from 'react-custom-scroll';
import { noop } from 'xod-func-tools';

import {
  PANEL_CONTEXT_MENU_ID,
  PANEL_IDS,
  SIDEBAR_IDS,
} from '../constants';

const SidebarPanelToolbar = ({
  panelId,
  title,
  sidebarId,
  autohide,
  additionalButtons = [],
}) => (
  <div className="SidebarPanel-toolbar">
    <div className="SidebarPanel-toolbar-title">
      {title}
    </div>
    <div className="SidebarPanel-toolbar-buttons">
      {additionalButtons}
      <ContextMenuTrigger
        id={PANEL_CONTEXT_MENU_ID}
        key="contextMenuTrigger"
        renderTag="button"
        attributes={{
          className: 'contextmenu',
        }}
        collect={() => ({
          panelId,
          sidebarId,
          autohide,
        })}
        holdToDisplay={0}
      >
        {/* Component needs at least one child :-( */}
        <span />
      </ContextMenuTrigger>
    </div>
  </div>
);

SidebarPanelToolbar.propTypes = {
  panelId: PropTypes.oneOf(R.values(PANEL_IDS)).isRequired,
  title: PropTypes.string.isRequired,
  sidebarId: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
  autohide: PropTypes.bool.isRequired,
  additionalButtons: PropTypes.arrayOf(PropTypes.element),
};

const SidebarPanel = ({
  id,
  title,
  additionalButtons = [],
  className = '',
  sidebarId,
  autohide,
  children,
  onScroll = noop,
}) => (
  <div className={`SidebarPanel ${className}`}>
    <SidebarPanelToolbar
      panelId={id}
      sidebarId={sidebarId}
      autohide={autohide}
      title={title}
      additionalButtons={additionalButtons}
    />
    <CustomScroll flex="1" onScroll={onScroll}>
      {children}
    </CustomScroll>
  </div>
);

SidebarPanel.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  className: PropTypes.string,
  sidebarId: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
  autohide: PropTypes.bool.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]).isRequired,
  additionalButtons: PropTypes.arrayOf(PropTypes.element),
  onScroll: PropTypes.func,
};

export default SidebarPanel;
