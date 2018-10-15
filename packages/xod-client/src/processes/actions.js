import * as R from 'ramda';
import * as ProcessSelectors from './selectors';

import { STATUS } from '../utils/constants';

export const addProcess = type => (dispatch, getState) => {
  const processes = ProcessSelectors.getProccesses(getState());
  const newId = ProcessSelectors.getNewId(processes);

  dispatch({
    type,
    meta: { status: STATUS.STARTED },
  });

  return newId;
};

export const progressProcess = (id, type, payload = {}) => dispatch =>
  dispatch({
    type,
    payload: R.merge(payload, { id }),
    meta: { status: STATUS.PROGRESSED },
  });

export const successProcess = (id, type, payload = {}) => dispatch =>
  dispatch({
    type,
    payload: R.merge(payload, { id }),
    meta: { status: STATUS.SUCCEEDED },
  });

export const failProcess = (id, type, payload = {}) => dispatch =>
  dispatch({
    type,
    payload: R.merge(payload, { id }),
    meta: { status: STATUS.FAILED },
  });

export const deleteProcess = (id, type) => ({
  type,
  payload: { id },
  meta: { status: STATUS.DELETED },
});

export const createProcess = type => dispatch => {
  const processId = dispatch(addProcess(type));

  const deleteThisProcess = () => dispatch(deleteProcess(processId, type));

  return {
    success: (message = '') => {
      dispatch(
        successProcess(processId, type, {
          message,
        })
      );
      deleteThisProcess();
    },
    fail: (message, percentage) => {
      dispatch(
        failProcess(processId, type, {
          message,
          percentage,
        })
      );
      deleteThisProcess();
    },
    progress: (message, percentage) =>
      dispatch(
        progressProcess(processId, type, {
          message,
          percentage,
        })
      ),
    delete: deleteThisProcess,
  };
};
