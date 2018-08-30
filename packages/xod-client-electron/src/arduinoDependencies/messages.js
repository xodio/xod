export default {
  ARDUINO_LIBRARIES_MISSING: ({ libraries, libraryNames }) => ({
    title: 'Some arduino libraries are missing',
    solution: `You have to install these libraries first: ${libraryNames}`,
    button: 'Download & Install',
    data: { libraries },
  }),
  ARDUINO_LIBRARIES_INSTALLED: ({ libraryNames }) => ({
    title: 'Arduino libraries installed',
    note: `Libraries ${libraryNames} installed`,
  }),
};
