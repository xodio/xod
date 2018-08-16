export const UPLOAD_STATUS = {
  STARTED: 'started',
  PROGRESSED: 'progressed',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
};

export const UPLOAD_MSG_TYPE = {
  XOD: 'xod',
  LOG: 'log',
  ERROR: 'error',
  SYSTEM: 'system',
  COMPILER: 'compiler',
  UPLOADER: 'uploader',
};

export const LOG_TAB_TYPE = {
  COMPILER: UPLOAD_MSG_TYPE.COMPILER,
  UPLOADER: UPLOAD_MSG_TYPE.UPLOADER,
  DEBUGGER: UPLOAD_MSG_TYPE.LOG,
};
