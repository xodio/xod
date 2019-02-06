import { UPLOAD_MSG_TYPE } from './constants';

export const createSystemMessage = message => ({
  type: UPLOAD_MSG_TYPE.SYSTEM,
  message,
});

export const createFlasherMessage = message => ({
  type: UPLOAD_MSG_TYPE.UPLOADER,
  message,
});

export const createErrorMessage = message => ({
  type: UPLOAD_MSG_TYPE.ERROR,
  message,
});

export const createOutgoingLogMessage = message => ({
  type: UPLOAD_MSG_TYPE.LOG_OUTGOING,
  message,
});
