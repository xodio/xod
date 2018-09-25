import * as R from 'ramda';
import { ipcRenderer } from 'electron';
import { getAllStatesForEvent } from '../shared/eventStates';

// :: Map EVENT_STATE EVENT_NAME_WITH_STATE -> _
const removeListenersForAllEventStates = R.compose(
  R.forEach(ipcRenderer.removeAllListeners),
  R.values
);

// :: EVENT_NAME -> ((a -> _) -> Object -> Promise a Error)
export default eventName => {
  const EVENT_STATES = getAllStatesForEvent(eventName);

  return (onProgress, payload) =>
    new Promise((resolve, reject) => {
      ipcRenderer.send(EVENT_STATES.BEGIN, payload);
      ipcRenderer.on(EVENT_STATES.PROCESS, (_, progressPayload) =>
        onProgress(progressPayload)
      );
      ipcRenderer.once(EVENT_STATES.COMPLETE, (_, res) => {
        removeListenersForAllEventStates(EVENT_STATES);
        resolve(res);
      });
      ipcRenderer.once(EVENT_STATES.ERROR, (_, err) => {
        removeListenersForAllEventStates(EVENT_STATES);
        reject(err);
      });
    });
};
