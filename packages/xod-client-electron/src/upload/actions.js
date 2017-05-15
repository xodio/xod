import client from 'xod-client';
import { transpileForEspruino } from 'xod-js';
import { foldEither } from 'xod-func-tools';
import uploadToEspruino from 'xod-espruino-upload';

import { UPLOAD, REQUEST_INSTALL_ARDUINO_IDE } from './actionTypes';

const progressUpload = (dispatch, id) => (message, percentage) => dispatch(
  client.progressProcess(
    id,
    UPLOAD,
    { message, percentage }
  )
);
const succeedUpload = (dispatch, id) => (message = '') => dispatch(
  client.successProcess(id, UPLOAD, { message })
);
const failUpload = (dispatch, id) => message => dispatch(
  client.failProcess(id, UPLOAD, { message })
);

const getTranspiledCode = (transpiler, state) => {
  const project = client.getProject(state);
  const curPatchId = client.getCurrentPatchId(state);
  return transpiler(project, curPatchId);
};

export const upload = () => (dispatch, getState) => {
  const eitherCode = getTranspiledCode(transpileForEspruino, getState());
  const processId = dispatch(client.addProcess(UPLOAD));
  const fail = failUpload(dispatch, processId);

  foldEither(
    fail,
    (code) => {
      uploadToEspruino(code, progressUpload(dispatch, processId))
        .then(succeedUpload(dispatch, processId))
        .catch(fail);
    },
    eitherCode
  );
};

export const uploadToArduino = () => (dispatch) => {
  const processId = dispatch(client.addProcess(UPLOAD));
  return {
    success: succeedUpload(dispatch, processId),
    fail: failUpload(dispatch, processId),
    progress: progressUpload(dispatch, processId),
  };
};

export const requestInstallArduinoIDE = () => ({
  type: REQUEST_INSTALL_ARDUINO_IDE,
  payload: {},
});

export default {
  upload,
  uploadToArduino,
};
