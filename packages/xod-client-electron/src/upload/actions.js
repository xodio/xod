import client from 'xod-client';
import { transpileForEspruino } from 'xod-js';
import { foldEither } from 'xod-func-tools';
import uploadToEspruino from 'xod-espruino-upload';

import {
  UPLOAD,
  REQUEST_INSTALL_ARDUINO_IDE,
  OPEN_UPLOAD_CONFIG,
  CLOSE_UPLOAD_CONFIG,
  SELECT_SERIAL_PORT,
} from './actionTypes';

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
  const curPatchPath = client.getCurrentPatchPath(state);
  return transpiler(project, curPatchPath);
};

export const upload = () => (dispatch, getState) => {
  const eitherCode = getTranspiledCode(transpileForEspruino, getState());
  const processId = dispatch(client.addProcess(UPLOAD));
  const fail = failUpload(dispatch, processId);

  foldEither(
    err => fail(err.message),
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

export const uploadToArduinoConfig = () => ({
  type: OPEN_UPLOAD_CONFIG,
  payload: {},
});

export const hideUploadConfigPopup = () => ({
  type: CLOSE_UPLOAD_CONFIG,
  payload: {},
});

export const requestInstallArduinoIDE = () => ({
  type: REQUEST_INSTALL_ARDUINO_IDE,
  payload: {},
});

export const selectSerialPort = port => ({
  type: SELECT_SERIAL_PORT,
  payload: {
    port,
  },
});

export default {
  upload,
  uploadToArduino,
};
