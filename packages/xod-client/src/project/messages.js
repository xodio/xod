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

export const PROJECT_NAME_NEEDED_TO_GENERATE_APIKEY = {
  title: 'Project name not set',
  note: 'To issue a new API token the project name must not be empty.',
  solution: 'Set the project name in Project Preferences and try again.',
};
