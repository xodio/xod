import * as R from 'ramda';
import client from 'xod-client';
import { SELECT_SERIAL_PORT, UPLOAD } from '../upload/actionTypes';
import { UPGRADE_ARDUINO_DEPENDECIES } from '../shared/events';

const initialState = {
  selectedSerialPort: null,
  isUploading: false,
  isInstallingArduinoDependencies: false,
  isUpgradingArduinoPackages: false,
};

const switchProcess = (propName, action, state) => {
  const status = R.path(['meta', 'status'], action);

  if (status === client.STATUS.STARTED) {
    return R.assoc(propName, true, state);
  }
  if (status === client.STATUS.SUCCEEDED || status === client.STATUS.FAILED) {
    return R.assoc(propName, false, state);
  }

  return state;
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SELECT_SERIAL_PORT:
      return R.assoc('selectedSerialPort', action.payload.port, state);

    case UPLOAD:
      return switchProcess('isUploading', action, state);

    case client.INSTALL_ARDUINO_DEPENDENCIES:
      return switchProcess('isInstallingArduinoDependencies', action, state);

    case UPGRADE_ARDUINO_DEPENDECIES:
      return switchProcess('isUpgradingArduinoPackages', action, state);

    default:
      return state;
  }
};
