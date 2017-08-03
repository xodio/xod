import * as EVENTS from './events';

export const CODE_TRANSPILED = 'Project was successfully transpiled. Searching for device...';
export const PORT_FOUND = 'Port with connected Arduino was found. Installing toolchains...';
export const TOOLCHAIN_INSTALLED = 'Toolchain is installed. Uploading...';

export const ENUMERATING_PORTS = 'Enumerating...';
export const ENUMERATING_BOARDS = 'Loading list of supported boards...';
export const NO_PORTS_FOUND = 'No connected boards found';

export const SUCCESS = {
  [EVENTS.SAVE_PROJECT]: 'Project was successfully saved',
};

export const PROJECT_SAVE_PROCESSED = '';
export const PROJECT_SAVE_FAILED = 'Failed to save project.';
export const PROJECT_SAVE_SUCCEED = 'Project has been saved successfully!';
