import R from 'ramda';
import { ipcRenderer } from 'electron';

import client from 'xod-client';
import ActionType from './actionTypes';
import uploadToEspruino from 'xod-espruino-upload';

import { getProjectPojo } from 'xod-core';
import { transpile, runtime } from 'xod-espruino';

export const upload = () => (dispatch, getState) => {
  const project = getProjectPojo(getState());
  const code = transpile({ project, runtime });

  const newId = dispatch(client.addProcess(ActionType.UPLOAD));

  const progress = (message, percentage) => dispatch(client.progressProcess(
    newId,
    ActionType.UPLOAD,
    {
      message,
      percentage,
    }
  ));

  const succeed = () => dispatch(client.successProcess(
    newId,
    ActionType.UPLOAD
  ));

  const fail = (err) => dispatch(client.failProcess(
    newId,
    ActionType.UPLOAD,
    { message: err.message }
  ));

  uploadToEspruino(code, progress)
    .then(succeed)
    .catch(fail);
};

export default {
  upload,
};
