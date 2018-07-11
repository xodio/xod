import {
  LINK_ERRORS as LE,
  NODETYPE_ERROR_TYPES as NTE,
} from '../editor/constants';

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

export const NODETYPE_ERRORS = {
  [NTE.CANT_DELETE_USED_PATCHNODE]: {
    title: 'Patch in use',
    note:
      'You are trying to delete a patch used as a node somewhere on another patch.',
    solution: 'Remove all patch nodes and try again.',
  },
  [NTE.CANT_DELETE_USED_PIN_OF_PATCHNODE]: {
    title: 'Pin in use',
    note:
      'You are trying to delete a terminal which represents node pins which have links on other patches.',
    solution: 'Delete all offending links first and try again.',
  },
};

export const missingPatchForNode = patchPath =>
  `Patch with type "${patchPath}" is not found in the project`;
