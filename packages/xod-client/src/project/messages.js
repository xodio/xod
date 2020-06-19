import { LINK_ERRORS as LE } from '../editor/constants';

export const SUCCESSFULLY_PUBLISHED = {
  title: 'Library published',
};

export const LINK_ERRORS = {
  [LE.SAME_DIRECTION]: {
    title: 'Impossible link',
    note: 'Links between pins of the same direction are not allowed.',
    solution:
      'Try creating a link between an input (pin on top) and output (pin at bottom)',
    persistent: false,
  },
  [LE.INCOMPATIBLE_TYPES]: {
    title: 'Incompatible pin types',
    note: `No implicit cast exist to convert the output type to the input type.`,
    solution: 'Try to find a node for the conversion and place it as a medium.',
    persistent: false,
  },
};

export const PROJECT_NAME_NEEDED_FOR_LITERAL = {
  title: 'Project name not set',
  note: 'The program uses the `=XOD_PROJECT` literal.',
  solution: 'Set the project name in Project Preferences and try again.',
};

export const PROJECT_NAME_NEEDED_TO_GENERATE_APIKEY = {
  title: 'Project name not set',
  note: 'To issue a new API token the project name must not be empty.',
  solution: 'Set the project name in Project Preferences and try again.',
};

export const CANT_GET_TOKEN_WITHOUT_APIKEY = {
  title: 'API key not set',
  note:
    'The program uses the `=XOD_TOKEN` literal. The project should have XOD Cloud API Key set to make it work.',
  solution:
    'Open Project Preferences to generate a new API key or enter existing one.',
};

// For server responses:
// 400 — bad API key
// 404 — revoked/invalid API key
export const CANT_GET_TOKEN_BECAUSE_OF_WRONG_APIKEY = {
  title: 'API key invalid',
  note:
    'The program uses the `=XOD_TOKEN` literal. The API key was revoked or has a wrong format.',
  solution:
    'Open Project Preferences to generate a new API key or enter existing one.',
};

export const cantCloneNoPatchFound = patchPath => ({
  title: 'Cannot clone patch',
  note: `Patch with path "${patchPath}" not found in the project`,
});
