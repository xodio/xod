import {
  LINK_ERRORS as LE,
  NODETYPE_ERROR_TYPES as NTE,
} from '../editor/constants';

export const SUCCESSFULLY_PUBLISHED = {
  title: 'Library published',
};

export const LINK_ERRORS = {
  [LE.SAME_DIRECTION]: {
    title: 'Canʼt create link between pins of the same direction!',
    persistent: false,
  },
  [LE.SAME_NODE]: {
    title: 'Canʼt create link between pins of the same node!',
    persistent: false,
  },
  [LE.UNKNOWN_ERROR]: {
    title: 'Canʼt create link',
    note: 'Unknown error!',
    persistent: false,
  },
  [LE.INCOMPATIBLE_TYPES]: {
    title: 'Incompatible pin types',
    persistent: false,
  },
};

export const NODETYPE_ERRORS = {
  [NTE.CANT_DELETE_USED_PATCHNODE]: {
    title: 'Canʼt delete Patch',
    note: 'Current Patch Node is used somewhere. You should remove it first!',
  },
  [NTE.CANT_DELETE_USED_PIN_OF_PATCHNODE]: {
    title: 'Canʼt delete Pin',
    note: [
      'Current IO Node is represents a Pin of Patch Node.',
      'And it is used somewhere.',
      'You should remove a linkage first!',
    ].join(' '),
  },
};

export const missingPatchForNode = patchPath =>
  `Patch with type "${patchPath}" is not found in the project`;
