export const libraryFoundAndInstalling = libQuery =>
  `Library "${libQuery}" was found. Resolving dependencies...`;

export const dependencyResolved = libName => `> "${libName}"`;

export const allLibrariesInstalled = wsPath =>
  `All listed librabies successfully installed into workspace "${wsPath}".`;

// TODO: All messages for Users should be moved here
