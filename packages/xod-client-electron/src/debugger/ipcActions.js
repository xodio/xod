import * as EVENTS from '../shared/events';

export const subscribeOnDebuggerEvents = (ipcRenderer, app) => {
  ipcRenderer.on(EVENTS.DEBUG_SESSION, (event, data) =>
    app.props.actions.logDebugger(data)
  );
  ipcRenderer.on(EVENTS.STOP_DEBUG_SESSION, (event, data) => {
    app.props.actions.stopDebuggerSession(data);
  });
};

export const sendStartDebuggerSession = (ipcRenderer, port) => {
  ipcRenderer.send(EVENTS.START_DEBUG_SESSION, {
    port,
  });
};

export const sendStopDebuggerSession = ipcRenderer => {
  ipcRenderer.send(EVENTS.STOP_DEBUG_SESSION);
};
