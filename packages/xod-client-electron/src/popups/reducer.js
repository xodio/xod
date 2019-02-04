import {
  popupsReducer,
  showOnlyPopup,
  hideOnePopup,
  POPUP_ID,
  SERIAL_SESSION_STARTED,
} from 'xod-client';

import {
  UPLOAD,
  UPLOAD_TO_ARDUINO,
  OPEN_UPLOAD_CONFIG,
  CLOSE_UPLOAD_CONFIG,
  OPEN_CONNECT_SERIAL_DIALOG,
  CLOSE_CONNECT_SERIAL_DIALOG,
  REQUEST_INSTALL_ARDUINO_IDE,
} from '../upload/actionTypes';

import {
  CREATE_WORKSPACE_REQUESTED,
  SWITCH_WORKSPACE_REQUESTED,
  CREATE_WORKSPACE,
  SWITCH_WORKSPACE,
} from '../settings/actionTypes';

import {
  ARDUPACKAGES_UPDATE_REQUEST,
  ARDUPACKAGES_UPDATE_POPUP_CLOSE,
  ARDUPACKAGES_UPGRADE_PROCEED,
} from '../arduinoDependencies/actionTypes';

export default (state, action) => {
  switch (action.type) {
    case UPLOAD:
    case UPLOAD_TO_ARDUINO: {
      if (action.meta.status === 'started') {
        return hideOnePopup(POPUP_ID.UPLOADING_CONFIG, state);
      }
      return state;
    }
    case OPEN_UPLOAD_CONFIG:
      return showOnlyPopup(
        POPUP_ID.UPLOADING_CONFIG,
        {
          debugAfterUpload: action.payload.debugAfterUpload,
        },
        state
      );
    case CLOSE_UPLOAD_CONFIG:
      return hideOnePopup(POPUP_ID.UPLOADING_CONFIG, state);

    case OPEN_CONNECT_SERIAL_DIALOG:
      return showOnlyPopup(POPUP_ID.CONNECT_SERIAL, {}, state);
    case CLOSE_CONNECT_SERIAL_DIALOG:
    case SERIAL_SESSION_STARTED:
      return hideOnePopup(POPUP_ID.CONNECT_SERIAL, state);

    case CREATE_WORKSPACE_REQUESTED:
      return showOnlyPopup(POPUP_ID.CREATING_WORKSPACE, action.payload, state);
    case SWITCH_WORKSPACE_REQUESTED:
      return showOnlyPopup(POPUP_ID.SWITCHING_WORKSPACE, action.payload, state);
    case REQUEST_INSTALL_ARDUINO_IDE:
      return showOnlyPopup(POPUP_ID.ARDUINO_IDE_NOT_FOUND, {}, state);

    case CREATE_WORKSPACE:
      return hideOnePopup(POPUP_ID.CREATING_WORKSPACE, state);
    case SWITCH_WORKSPACE:
      return hideOnePopup(POPUP_ID.SWITCHING_WORKSPACE, state);

    case ARDUPACKAGES_UPDATE_REQUEST:
      return showOnlyPopup(POPUP_ID.UPDATE_ARDUINO_PACKAGES_POPUP, {}, state);
    case ARDUPACKAGES_UPGRADE_PROCEED:
    case ARDUPACKAGES_UPDATE_POPUP_CLOSE:
      return hideOnePopup(POPUP_ID.UPDATE_ARDUINO_PACKAGES_POPUP, state);

    default:
      return popupsReducer(state, action);
  }
};
