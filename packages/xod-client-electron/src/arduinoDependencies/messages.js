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
};
