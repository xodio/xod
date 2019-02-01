import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cls from 'classnames';

import { SIDEBAR_IDS, PANEL_IDS } from '../constants';
import {
  sidebarPanelRenderer,
  getPanelsBySidebarId,
  filterMaximized,
} from '../utils';

const getShowHideTooltipMessage = (panelName, maximized) =>
  maximized ? `Hide ${panelName}` : `Show ${panelName}`;

const SidebarSwitches = ({
  id,
  isMinimized,
  panels,
  onTogglePanel,
  isLoggedIn = false,
}) => {
  const panelsForThisSidebar = getPanelsBySidebarId(id, panels);
  const maximizedPanels = filterMaximized(panelsForThisSidebar);

  const classNames = cls('Sidebar-title', {
    'Sidebar-title--left': id === SIDEBAR_IDS.LEFT,
    'Sidebar-title--right': id === SIDEBAR_IDS.RIGHT,
    'Sidebar-title--minimized': isMinimized,
    'Sidebar-title--hidden': isMinimized && maximizedPanels.length > 0,
  });

  const onToggleProjectBrowserPanel = () =>
    onTogglePanel(PANEL_IDS.PROJECT_BROWSER);
  const onToggleInspectorPanel = () => onTogglePanel(PANEL_IDS.INSPECTOR);
  const onToggleAccountPanel = () => onTogglePanel(PANEL_IDS.ACCOUNT);
  const ontoggleHelpPanel = () => onTogglePanel(PANEL_IDS.HELPBAR);

  return (
    <div className={classNames}>
      {R.map(
        R.cond([
          sidebarPanelRenderer(PANEL_IDS.PROJECT_BROWSER, ({ maximized }) => (
            <button
              key="projectBrowser"
              className={`projectBrowser ${maximized && 'selected'}`}
              title={getShowHideTooltipMessage('Project Browser', maximized)}
              onClick={onToggleProjectBrowserPanel}
            />
          )),
          sidebarPanelRenderer(PANEL_IDS.INSPECTOR, ({ maximized }) => (
            <button
              key="inspector"
              className={`inspector ${maximized && 'selected'}`}
              title={getShowHideTooltipMessage('Inspector', maximized)}
              onClick={onToggleInspectorPanel}
            />
          )),
          sidebarPanelRenderer(PANEL_IDS.ACCOUNT, ({ maximized }) => (
            <button
              key="account"
              className={`account ${maximized && 'selected'} ${!isLoggedIn &&
                'not-logged-in'}`}
              title={getShowHideTooltipMessage('Account Pane', maximized)}
              onClick={onToggleAccountPanel}
            />
          )),
          sidebarPanelRenderer(PANEL_IDS.HELPBAR, ({ maximized }) => (
            <button
              key="helppanel"
              className={`helppanel ${maximized && 'selected'}`}
              title={getShowHideTooltipMessage('Quick Help', maximized)}
              onClick={ontoggleHelpPanel}
            />
          )),
        ]),
        panelsForThisSidebar
      )}
    </div>
  );
};

SidebarSwitches.propTypes = {
  isMinimized: PropTypes.bool.isRequired,
  id: PropTypes.string.isRequired,
  panels: PropTypes.objectOf(
    PropTypes.shape({
      /* eslint-disable react/no-unused-prop-types */
      maximized: PropTypes.bool.isRequired,
      sidebar: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
      autohide: PropTypes.bool.isRequired,
      /* eslint-enable react/no-unused-prop-types */
    })
  ),
  onTogglePanel: PropTypes.func.isRequired,
  isLoggedIn: PropTypes.bool,
};

export default SidebarSwitches;
