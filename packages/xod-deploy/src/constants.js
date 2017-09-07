export const COMPILATION_RESPONSE_TYPES = {
  FAILED: 'Failed',
  SUCCEEDED: 'Succeeded',
  TIMEDOUT: 'TimedOut',
};

export const COMPILATION_ERRORS = {
  COMPILE_FAILED: COMPILATION_RESPONSE_TYPES.FAILED,
  COMPILE_TIMEDOUT: COMPILATION_RESPONSE_TYPES.TIMEDOUT,
  CLOSED: 'ConnectionClosed',
  FAILED: 'ConnectionFailed',
};

export const RESPONSE_TO_ERROR = {
  [COMPILATION_RESPONSE_TYPES.FAILED]: COMPILATION_ERRORS.COMPILE_FAILED,
  [COMPILATION_RESPONSE_TYPES.TIMEDOUT]: COMPILATION_ERRORS.COMPILE_TIMEDOUT,
};

export const RETRY_DELAYS = [500, 1000, 1000, 2000, 5000];

// TODO: Change URLs to xod.io, when microservices will be released
export const DEFAULT_UPLOAD_CONFIG_URL = 'https://compile.xod.show/upload/';
export const DEFAULT_CLOUD_COMPILE_URL = 'wss://compile.xod.show/compile';
