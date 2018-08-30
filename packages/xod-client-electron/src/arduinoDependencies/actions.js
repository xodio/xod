import * as client from 'xod-client';

export const checkDeps = () => dispatch => {
  const processId = dispatch(
    client.addProcess(client.CHECK_ARDUINO_DEPENDENCIES)
  );
  const deleteProcess = () =>
    dispatch(
      client.deleteProcess(processId, client.CHECK_ARDUINO_DEPENDENCIES)
    );

  return {
    success: (message = '') => {
      dispatch(
        client.successProcess(processId, client.CHECK_ARDUINO_DEPENDENCIES, {
          message,
        })
      );
      deleteProcess();
    },
    fail: (message, percentage) => {
      dispatch(
        client.failProcess(processId, client.CHECK_ARDUINO_DEPENDENCIES, {
          message,
          percentage,
        })
      );
      deleteProcess();
    },
    progress: (message, percentage) =>
      dispatch(
        client.progressProcess(processId, client.CHECK_ARDUINO_DEPENDENCIES, {
          message,
          percentage,
        })
      ),
    delete: deleteProcess,
  };
};

export const installDeps = () => dispatch => {
  const processId = dispatch(
    client.addProcess(client.INSTALL_ARDUINO_DEPENDENCIES)
  );
  const deleteProcess = () =>
    dispatch(
      client.deleteProcess(processId, client.INSTALL_ARDUINO_DEPENDENCIES)
    );

  return {
    success: (message = '') => {
      dispatch(
        client.successProcess(processId, client.INSTALL_ARDUINO_DEPENDENCIES, {
          message,
        })
      );
      deleteProcess();
    },
    fail: (message, percentage) => {
      dispatch(
        client.failProcess(processId, client.INSTALL_ARDUINO_DEPENDENCIES, {
          message,
          percentage,
        })
      );
      deleteProcess();
    },
    progress: (message, percentage) =>
      dispatch(
        client.progressProcess(processId, client.INSTALL_ARDUINO_DEPENDENCIES, {
          message,
          percentage,
        })
      ),
    delete: deleteProcess,
  };
};
