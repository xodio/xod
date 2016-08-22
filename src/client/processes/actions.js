import * as ActionType from './actionTypes';
import ProcessSelectors from './selectors';

import * as STATUS from 'xod/client/constants/statuses';
import ProjectSelectors from 'xod/client/project/selectors';
import { uploadToEspruino } from 'xod/utils/espruino';

export const upload = () => (dispatch, getState) => {
  const project = ProjectSelectors.getProjectPojo(getState());
  const processes = ProcessSelectors.getProccesses(getState());
  const newId = ProcessSelectors.getNewId(processes);

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

  uploadToEspruino(project, progress)
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
