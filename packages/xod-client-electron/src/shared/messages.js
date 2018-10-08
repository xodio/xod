import composeMessage from './composeMessage';

export const BEGIN_COMPILATION_IN_CLOUD = 'Compiling code in the cloud...';
export const CODE_TRANSPILED =
  'Project was successfully transpiled. Searching for device...';
export const PORT_FOUND =
  'Port with connected Arduino was found. Installing toolchains...';
export const TOOLCHAIN_INSTALLED = 'Toolchain is installed. Compiling...';
export const CLOUD_TOOLCHAIN_INSTALLED =
  'Toolchain is installed. Compiling code in the cloud...';
export const CODE_COMPILED = 'Code compiled succesfully. Uploading...';

export const ENUMERATING_PORTS = 'Enumerating...';
export const ENUMERATING_BOARDS = 'Loading list of supported boards...';
export const NO_PORTS_FOUND = 'No connected boards found';

export const SAVE_ALL_FAILED = {
  title: 'Failed to save project.',
};
export const SAVE_ALL_SUCCEED = {
  title: 'Saved successfully!',
};

export const DEBUG_SESSION_STOPPED_ON_TAB_CLOSE = {
  title: 'Debug session stopped',
  note: 'You closed the debugger tab.',
  persistent: false,
};
export const DEBUG_LOST_CONNECTION = 'Lost connection with the device.';

export const UPLOAD_PROCESS_BEGINS = 'Uploading compiled code to the board...';

export const updateAvailableMessage = version =>
  composeMessage(
    'Update available',
    `New version ${version} of XOD\u00A0IDE is available`,
    'Download & Install'
  );

export const compilationBegun = boardName =>
  `Begin compiling code for the board ${boardName}`;
