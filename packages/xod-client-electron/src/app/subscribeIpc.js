import { ipcMain } from 'electron';
import { getAllStatesForEvent } from '../shared/eventStates';
import { errorToPlainObject } from './utils';

// :: (IpcEvent -> Object -> (ProgressData -> _) -> Promise a Error) -> EVENT_NAME -> (IpcEvent -> Object -> _)
export default (fn, eventName) => {
  const STATES = getAllStatesForEvent(eventName);
  ipcMain.on(STATES.BEGIN, (event, payload) => {
    const onProgress = data => event.sender.send(STATES.PROCESS, data);

    fn(event, payload, onProgress)
      .then(res => event.sender.send(STATES.COMPLETE, res))
      .catch(err => event.sender.send(STATES.ERROR, errorToPlainObject(err)));
  });
};
