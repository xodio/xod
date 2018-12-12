import { ipcMain } from 'electron';
import { getAllStatesForEvent } from '../shared/eventStates';
import { errorToPlainObject } from './utils';

export default (fn, eventName) => {
  const STATES = getAllStatesForEvent(eventName);
  const listener = (event, payload) => {
    // Prevent sending data to the closed window
    // because it produces an exception
    if (event.sender.isDestroyed()) return;

    const onProgress = data => {
      // Prevent sending data to the closed window
      // because it produces an exception
      if (event.sender.isDestroyed()) return;

      event.sender.send(STATES.PROCESS, data);
    };

    fn(event, payload, onProgress)
      .then(res => event.sender.send(STATES.COMPLETE, res))
      .catch(err => event.sender.send(STATES.ERROR, errorToPlainObject(err)));
  };

  ipcMain.on(STATES.BEGIN, listener);

  return () => ipcMain.removeListener(STATES.BEGIN, listener);
};
