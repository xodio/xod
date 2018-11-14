const librariesMissing = libraryNames =>
  libraryNames.length
    ? `You have to install these libraries first: ${libraryNames}`
    : null;

const librariesInstalled = libraryNames =>
  libraryNames.length
    ? `Libraries ${libraryNames} installed successfully`
    : null;

const packagesMissing = packageNames =>
  packageNames.length
    ? `You have to install these packages first: ${packageNames}`
    : null;

const packagesInstalled = packageNames =>
  packageNames.length
    ? `Package "${packageNames}" installed successfully`
    : null;

export default {
  ARDUINO_DEPENDENCIES_MISSING: ({
    libraries,
    libraryNames,
    packages,
    packageNames,
  }) => ({
    title: 'Arduino dependencies missing',
    solution: [librariesMissing(libraryNames), packagesMissing(packageNames)]
      .filter(a => !!a)
      .join('\r\n'),
    button: 'Download & Install',
    data: { libraries, packages, packageNames },
    persistent: true,
  }),

  ARDUINO_DEPENDENCIES_INSTALLED: ({ libraryNames, packageNames }) => ({
    title: 'Arduino dependencies installed',
    note: [librariesInstalled(libraryNames), packagesInstalled(packageNames)]
      .filter(a => !!a)
      .join('\r\n'),
    solution: 'Now you are able to upload the program',
    persistent: true,
  }),

  ARDUINO_CLI_NOT_FOUND: ({ path, isDev }) => ({
    title: 'arduino-cli not found',
    note: path
      ? `Tried to find arduino-cli on the path: ${path}`
      : 'Tried to find arduino-cli on $PATH',
    solution: isDev
      ? 'When running in the development mode `arduino-cli` should be available on $PATH or explicitly set with $XOD_ARDUINO_CLI environment variable'
      : 'This is a bug, report it to XOD developers',
  }),

  ARDUINO_PACKAGES_UPDATED: () => ({
    title: 'All Arduino packages updated',
    persistent: true,
  }),

  COMPILE_TOOL_ERROR: ({ message }) => ({
    title: 'Compilation failed',
    note: `Command ${message}`,
    solution:
      'The generated C++ code contains errors. It can be due to a bad node implementation or if your board is not compatible with XOD runtime code. The original compiler error message is above. Fix C++ errors to continue. If you believe it is a bug, report the problem to XOD developers.',
  }),

  UPLOAD_TOOL_ERROR: ({ message }) => ({
    title: 'Upload failed',
    note: `Command ${message}`,
    solution:
      'Make sure the board is connected, the cable is working, the board model set correctly, the upload port belongs to the board, the board drivers are installed, the upload options (if any) match your board specs.',
  }),

  UPLOADED_SUCCESSFULLY: () => ({
    title: 'Uploaded successfully',
  }),

  UPDATE_INDEXES_ERROR_BROKEN_FILE: ({ pkgPath, error }) => ({
    title: 'Package index broken',
    note: `Error: ${error}`,
    solution: `Check correctness of the corresponding URL in "${pkgPath}/extra.txt" and try to update indexes again`,
  }),

  UPDATE_INDEXES_ERROR_NO_CONNECTION: ({ pkgPath, error }) => ({
    title: 'Cannot update indexes',
    note: error,
    solution: `Check your internet connection and correctness of URLs in "${pkgPath}/extra.txt", then try again`,
  }),
};
