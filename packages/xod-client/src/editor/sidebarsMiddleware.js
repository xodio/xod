import * as R from 'ramda';
import {
  RESIZE_PANELS,
  MINIMIZE_PANEL,
  MAXIMIZE_PANEL,
  MOVE_PANEL,
  TOGGLE_PANEL_AUTOHIDE,
} from './actionTypes';
import { getPanelSettings } from './selectors';

const changeSidebarActions = [
  MINIMIZE_PANEL,
  MAXIMIZE_PANEL,
  MOVE_PANEL,
  TOGGLE_PANEL_AUTOHIDE,
];

const savePanelSettings = R.curry((panelId, settings) =>
  window.localStorage.setItem(`Sidebar.${panelId}`, JSON.stringify(settings))
);

export default store => next => action => {
  if (R.contains(action.type, changeSidebarActions)) {
    const panelId = action.payload.panelId;
    const res = next(action);
    R.compose(
      savePanelSettings(panelId),
      getPanelSettings(panelId),
      store.getState
    )();

    return res;
  }
  if (action.type === RESIZE_PANELS) {
    const panelIds = R.keys(action.payload);
    const res = next(action);
    const state = store.getState();

    R.map(
      panelId =>
        R.compose(savePanelSettings(panelId), getPanelSettings(R.__, state))(
          panelId
        ),
      panelIds
    );

    return res;
  }

  return next(action);
};
