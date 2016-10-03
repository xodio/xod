import React from 'react';

import { createDevTools } from 'redux-devtools';
import DockMonitor from 'redux-devtools-dock-monitor';
import FilterableLogMonitor from 'redux-devtools-filterable-log-monitor';
import Dispatcher from 'redux-devtools-dispatch';


export default createDevTools(
  <DockMonitor
    toggleVisibilityKey="ctrl-h"
    changePositionKey="ctrl-p"
    changeMonitorKey="ctrl-m"
    defaultIsVisible={false}
    defaultPosition="right"
  >
    <FilterableLogMonitor />
    <Dispatcher />
  </DockMonitor>
);
