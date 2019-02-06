export const UPLOAD_MSG_TYPE = {
  XOD: 'xod',
  LOG: 'log',
  LOG_OUTGOING: 'log_outgoing',
  ERROR: 'error',
  SYSTEM: 'system',
  COMPILER: 'compiler',
  UPLOADER: 'uploader',
  INSTALLER: 'installer',
  TESTER: 'tester',
};

export const LOG_TAB_TYPE = {
  INSTALLER: UPLOAD_MSG_TYPE.INSTALLER,
  COMPILER: UPLOAD_MSG_TYPE.COMPILER,
  UPLOADER: UPLOAD_MSG_TYPE.UPLOADER,
  DEBUGGER: UPLOAD_MSG_TYPE.LOG,
  TESTER: UPLOAD_MSG_TYPE.TESTER,
};

export const SESSION_TYPE = {
  NONE: 'none',
  DEBUG: 'debug',
  SERIAL: 'serial',
  SIMULATON: 'simulation',
};
