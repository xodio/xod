import {
  popupsReducer,
  showOnlyPopup,
  hideOnePopup,
  POPUP_ID,
} from 'xod-client';

import {
  UPLOAD,
  UPLOAD_TO_ARDUINO,
  OPEN_UPLOAD_CONFIG,
  CLOSE_UPLOAD_CONFIG,
  REQUEST_INSTALL_ARDUINO_IDE,
} from '../upload/actionTypes';

import {
  CREATE_WORKSPACE_REQUESTED,
  SWITCH_WORKSPACE_REQUESTED,
  CREATE_WORKSPACE,
  SWITCH_WORKSPACE,
} from '../settings/actionTypes';

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

    default:
      return popupsReducer(state, action);
  }
};
