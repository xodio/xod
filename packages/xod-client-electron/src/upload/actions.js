import client from 'xod-client';

import {
  UPLOAD,
  OPEN_UPLOAD_CONFIG,
  CLOSE_UPLOAD_CONFIG,
  SELECT_SERIAL_PORT,
  OPEN_CONNECT_SERIAL_DIALOG,
  CLOSE_CONNECT_SERIAL_DIALOG,
} from './actionTypes';

export const uploadToArduino = () => dispatch => {
  const processId = dispatch(client.addProcess(UPLOAD));
  const deleteProcess = () => dispatch(client.deleteProcess(processId, UPLOAD));

  return {
    success: (message = '') => {
      dispatch(client.successProcess(processId, UPLOAD, { message }));
      deleteProcess();
    },
    fail: (message, percentage) => {
      dispatch(client.failProcess(processId, UPLOAD, { message, percentage }));
      deleteProcess();
    },
    progress: (message, percentage, tab) =>
      dispatch(
        client.progressProcess(processId, UPLOAD, { message, percentage, tab })
      ),
    delete: deleteProcess,
  };
};

export const uploadToArduinoConfig = (debugAfterUpload = false) => ({
  type: OPEN_UPLOAD_CONFIG,
  payload: {
    debugAfterUpload,
  },
});

export const hideUploadConfigPopup = () => ({
  type: CLOSE_UPLOAD_CONFIG,
  payload: {},
});

export const openConnectSerialDialog = () => ({
  type: OPEN_CONNECT_SERIAL_DIALOG,
});

export const closeConnectSerialDialog = () => ({
  type: CLOSE_CONNECT_SERIAL_DIALOG,
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
