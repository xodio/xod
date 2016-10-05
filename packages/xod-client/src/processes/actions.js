import * as ActionType from './actionTypes';
import * as ProcessSelectors from './selectors';

import { STATUS } from '../utils/constants';
import { getProjectPojo } from 'xod-core';
import { upload as uploadToEspruino, transpile } from 'xod-espruino';

export const upload = () => (dispatch, getState) => {
  const project = getProjectPojo(getState());
  const processes = ProcessSelectors.getProccesses(getState());
  const newId = ProcessSelectors.getNewId(processes);
  const code = transpile(project);

  dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.STARTED },
  });

  const progress = (message, percentage) => dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.PROGRESSED },
    payload: {
      id: newId,
      message,
      percentage,
    },
  });

  const succeed = () => dispatch({
    type: ActionType.UPLOAD,
    payload: {
      id: newId,
    },
    meta: { status: STATUS.SUCCEEDED },
  });

  const fail = (err) => dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.FAILED },
    payload: {
      id: newId,
      message: err.message,
    },
  });

  uploadToEspruino(code, progress)
    .then(succeed)
    .catch(err => {
      if (err.constructor !== Error) {
        throw err;
      }

      fail(err);
    });
};

export const deleteProcess = (id, type) => ({
  type,
  payload: {
    id,
  },
  meta: {
    status: STATUS.DELETED,
  },
});
