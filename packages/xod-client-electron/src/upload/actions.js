import client from 'xod-client';
import { transpileForEspruino } from 'xod-js';
import { foldEither } from 'xod-func-tools';
import uploadToEspruino from 'xod-espruino-upload';

import { UPLOAD } from './actionTypes';

export const upload = () => (dispatch, getState) => {
  const state = getState();
  const project = client.getProject(state);
  const curPatchId = client.getCurrentPatchId(state);
  const eitherCode = transpileForEspruino(project, curPatchId);

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

  foldEither(
    fail,
    (code) => {
      uploadToEspruino(code, progress)
        .then(succeed)
        .catch(fail);
    },
    eitherCode
  );
};

export default {
  upload,
};
