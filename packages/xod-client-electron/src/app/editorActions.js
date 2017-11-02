import R from 'ramda';
import * as settings from './settings';
import * as EVENTS from '../shared/events';

export const loadSidebarPaneHeight = event => R.compose(
  size => event.sender.send(
    EVENTS.GET_SIDEBAR_PANE_HEIGHT,
    size
  ),
  settings.getSidebarPaneHeight(),
  settings.load
)();

export const saveSidebarPaneHeight = (event, payload) => R.compose(
  settings.save,
  settings.setSidebarPaneHeight(payload),
  settings.load
)();
