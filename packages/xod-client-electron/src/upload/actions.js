import { getProjectPojo } from 'xod-core';
import client from 'xod-client';
import { transpileForEspruino } from 'xod-js';
import { toV2 } from 'xod-project';
import uploadToEspruino from 'xod-espruino-upload';

import { UPLOAD } from './actionTypes';

export const upload = () => (dispatch, getState) => {
  const state = getState();
  const project = getProjectPojo(state);
  const curPatchId = client.getCurrentPatchId(state);
  const projectV2 = toV2(project);
  const code = transpileForEspruino(projectV2, curPatchId);

  const newId = dispatch(client.addProcess(UPLOAD));

  const progress = (message, percentage) => dispatch(client.progressProcess(
    newId,
    UPLOAD,
    {
      message,
      percentage,
    }
  ));

  const succeed = () => dispatch(client.successProcess(
    newId,
    UPLOAD
  ));

  const fail = err => dispatch(client.failProcess(
    newId,
    UPLOAD,
    { message: err.message }
  ));

  uploadToEspruino(code, progress)
    .then(succeed)
    .catch(fail);
};

export default {
  upload,
};
