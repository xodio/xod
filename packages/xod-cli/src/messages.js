export default {
  UNKNOWN_ERROR: ({ message }) => ({
    title: 'Error',
    note: message,
    solution:
      'The error has no formatter, which is a bug. Report the issue to XOD developers.',
  }),

  TRIED_TO_OPEN_NOT_XOD_FILE: ({ path }) => ({
    title: 'Invalid file path',
    note: `File ${path} does not exist`,
    solution:
      'Provide a valid path to either patch, project directory, or xodball',
  }),

  PUBLISH_AUTH_FAILED: ({ username, status }) => ({
    title: 'Authentication failed',
    note: `Can't authenticate user ${username} in XOD API: ${status}`,
    solution:
      'Most likely, the password is incorrect but also ensure the username is spelled correctly',
  }),

  PUBLISH_USER_NOT_EXIST: ({ username }) => ({
    title: `Unknown user`,
    note: `User ${username} not found in XOD API`,
    solution: 'Double check the username spelling',
  }),

  PUBLISH_USER_OTHER_ERROR: ({ username, status }) => ({
    title: `Unexpected API failure`,
    note: `Can't get user ${username}: ${status}`,
    solution: 'Possibly XOD API is temporary out of service. Try again later',
  }),

  PUBLISH_ACCESS_DENIED: ({ username, lib, libOwner }) => ({
    title: `Access denied`,
    note: `User "${username}" can't access ${lib}`,
    solution: `To publish on behalf of another user, ${libOwner} should add ${username} to the list of trusted users`,
  }),

  PUBLISH_LIB_OTHER_ERROR: ({ lib, status }) => ({
    title: `Unexpected API failure`,
    note: `Can't access library ${lib}: ${status}`,
    solution: 'Possibly XOD API is temporary out of service. Try again later',
  }),

  PUBLISH_PUT_LIBRARY_OTHER_ERROR: ({ lib, status }) => ({
    title: `Unexpected API failure`,
    note: `Can't create library ${lib}: ${status}`,
    solution: 'Possibly XOD API is temporary out of service. Try again later',
  }),

  PUBLISH_LIBVERSION_EXISTS: ({ lib }) => ({
    title: `Library version already exists`,
    note: `Library version ${lib} already exists`,
    solution: `ump the version of the library and try again`,
  }),

  PUBLISH_POST_LIBVERSION_OTHER_ERROR: ({ lib, status }) => ({
    title: `Unexpected API failure`,
    note: `Can't publish library version ${lib}: of ${status}`,
    solution: 'Possibly XOD API is temporary out of service. Try again later',
  }),

  TABTEST_PROCESS_NONZERO: ({ cmd, code }) => ({
    title: `Tabtests failed`,
    note: `${cmd} exited with code ${code}`,
  }),
};
