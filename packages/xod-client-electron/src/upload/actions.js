
import client from 'xod-client';
import uploadToEspruino from 'xod-espruino-upload';

import { UPLOAD } from './actionTypes';
import { getProjectPojo } from 'xod-core';
import { transpile, runtime } from 'xod-espruino';

export const upload = () => (dispatch, getState) => {
  const project = getProjectPojo(getState());
  const code = transpile({ project, runtime });

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

  const fail = (err) => dispatch(client.failProcess(
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
