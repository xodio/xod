import * as client from 'xod-client';
import { UPGRADE_ARDUINO_DEPENDECIES } from '../shared/events';
import * as AT from './actionTypes';

export const checkDeps = client.createProcess(
  client.CHECK_ARDUINO_DEPENDENCIES
);

export const installDeps = client.createProcess(
  client.INSTALL_ARDUINO_DEPENDENCIES
);

export const updateArdupackages = () => ({
  type: AT.ARDUPACKAGES_UPDATE_REQUEST,
});
export const closePackageUpdatePopup = () => ({
  type: AT.ARDUPACKAGES_UPDATE_POPUP_CLOSE,
});

export const proceedPackageUpgrade = () => ({
  type: AT.ARDUPACKAGES_UPGRADE_PROCEED,
});

export const updatePackages = () =>
  client.createProcess(UPGRADE_ARDUINO_DEPENDECIES);
