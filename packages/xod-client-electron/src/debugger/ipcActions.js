import * as EVENTS from '../shared/events';

export const subscribeOnDebuggerEvents = (ipcRenderer, app) => {
  ipcRenderer.on(EVENTS.SERIAL_SESSION_MESSAGE_RECEIVE, (event, data) =>
    app.props.actions.logDebugger(data)
  );
  ipcRenderer.on(EVENTS.SERIAL_PORT_CLOSED, (event, data) => {
    app.props.actions.stopDebuggerSession(data);
  });
};

export const sendStartDebuggerSession = (ipcRenderer, port, sessionKind) => {
  ipcRenderer.send(EVENTS.START_DEBUG_SESSION, {
    port,
    sessionKind,
  });
};

export const sendStopDebuggerSession = ipcRenderer => {
  ipcRenderer.send(EVENTS.STOP_DEBUG_SESSION);
};
