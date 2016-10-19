import R from 'ramda';
import * as ActionType from './actionTypes';
import * as ProcessSelectors from './selectors';

import { STATUS } from '../utils/constants';
import { getProjectPojo } from 'xod-core';
import { upload as uploadToEspruino, transpile, runtime } from 'xod-espruino';

export const addProcess = (type) => (dispatch, getState) => {
  const processes = ProcessSelectors.getProccesses(getState());
  const newId = ProcessSelectors.getNewId(processes);

  dispatch({
    type,
    meta: { status: STATUS.STARTED },
  });

  return newId;
};

export const progressProcess = (id, type, payload = {}) => (dispatch) => dispatch({
  type,
  payload: R.merge(payload, { id }),
  meta: { status: STATUS.PROGRESSED },
});

export const successProcess = (id, type, payload = {}) => (dispatch) => dispatch({
  type,
  payload: R.merge(payload, { id }),
  meta: { status: STATUS.SUCCEEDED },
});

export const failProcess = (id, type, payload = {}) => (dispatch) => dispatch({
  type,
  payload: R.merge(payload, { id }),
  meta: { status: STATUS.FAILED },
});

export const deleteProcess = (id, type) => ({
  type,
  payload: { id },
  meta: { status: STATUS.DELETED },
});

export const upload = () => (dispatch, getState) => {
  const project = getProjectPojo(getState());
  const code = transpile({ project, runtime });

  const newId = addProcess(ActionType.UPLOAD);

  const progress = (message, percentage) => progressProcess(
    newId,
    ActionType.UPLOAD,
    {
      message,
      percentage,
    }
  );
  const succeed = () => successProcess(
    newId,
    ActionType.UPLOAD
  );
  const fail = (err) => failProcess(
    newId,
    ActionType.UPLOAD,
    { message: err.message }
  );

  uploadToEspruino(code, progress)
    .then(succeed)
    .catch(err => {
      if (err.constructor !== Error) {
        throw err;
      }

      fail(err);
    });
};
