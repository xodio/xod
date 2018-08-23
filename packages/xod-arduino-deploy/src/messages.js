export default {
  CANT_GET_LIBRARY_NAME: ({ url }) => ({
    title: 'Wrong library URL or library name',
    note: `Tried to download library from "${url}"`,
  }),
  // Console messages
  LIBRARY_EXIST: ({ libName }) => ({
    note: `Library "${libName}" already installed`,
  }),
  LIBRARY_MISSING: ({ libName }) => ({
    note: `Library "${libName}" is missing`,
  }),
  LIBRARY_DOWNLOADED: ({ libName }) => ({
    note: `Library "${libName}" is downloaded`,
  }),
  LIBRARY_INSTALLED: ({ libName }) => ({
    note: `Library "${libName}" installed successfully`,
  }),
};
