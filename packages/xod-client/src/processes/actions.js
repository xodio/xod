import R from 'ramda';
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

export const progressProcess = (id, type, payload = {}) => dispatch => dispatch({
  type,
  payload: R.merge(payload, { id }),
  meta: { status: STATUS.PROGRESSED },
});

export const successProcess = (id, type, payload = {}) => dispatch => dispatch({
  type,
  payload: R.merge(payload, { id }),
  meta: { status: STATUS.SUCCEEDED },
});

export const failProcess = (id, type, payload = {}) => dispatch => dispatch({
  type,
  payload: R.merge(payload, { id }),
  meta: { status: STATUS.FAILED },
});

export const deleteProcess = (id, type) => ({
  type,
  payload: { id },
  meta: { status: STATUS.DELETED },
});
