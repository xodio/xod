import client from 'xod-client';

import {
  UPLOAD,
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

export const selectSerialPort = port => ({
  type: SELECT_SERIAL_PORT,
  payload: {
    port,
  },
});

export default {
  uploadToArduino,
};
