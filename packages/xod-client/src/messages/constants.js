import {
  LINK_ERRORS as LE,
  NODETYPE_ERROR_TYPES as NTE,
  PROPERTY_ERRORS as PE,
  CLIPBOARD_ERRORS as CE,
} from '../editor/constants';

export const MESSAGE_TYPE = {
  ERROR: 'ERROR',
  CONFIRMATION: 'CONFIRMATION',
  NOTIFICATION: 'NOTIFICATION',
};

export const LINK_ERRORS = {
  [LE.SAME_DIRECTION]: 'Can`t create link between pins of the same direction!',
  [LE.SAME_NODE]: 'Can`t create link between pins of the same node!',
  [LE.ONE_LINK_FOR_INPUT_PIN]: 'Input pin can have only one link!',
  [LE.UNKNOWN_ERROR]: 'Unknown error!',
  [LE.INCOMPATIBLE_TYPES]: 'Incompatible pin types!',
};

export const PROJECT_BROWSER_ERRORS = {
  CANT_OPEN_LIBPATCH_WITHOUT_XOD_IMPL: 'This patch has only native implementation and can`t be opened',
  CANT_DELETE_CURRENT_PATCH: 'Current patch cannot been deleted. Switch to another patch before!',
  PATCH_NAME_TAKEN: 'This patch name is already taken!',
  INVALID_PATCH_NAME: 'Invalid patch name',
  INVALID_PROJECT_NAME: 'Invalid project name',
};

export const NODETYPE_ERRORS = {
  [NTE.CANT_DELETE_USED_PATCHNODE]: (
    'Current Patch Node is used somewhere. You should remove it first!'
  ),
  [NTE.CANT_DELETE_USED_PIN_OF_PATCHNODE]: [
    'Current IO Node is represents a Pin of Patch Node.',
    'And it is used somewhere.',
    'You should remove a linkage first!',
  ].join(' '),
};

export const PROPERTY_ERRORS = {
  [PE.PIN_HAS_LINK]: [
    'Can`t convert a pin into property, because it has a connected links.',
    'You should remove links first!',
  ].join(' '),
};

export const CLIPBOARD_ERRORS = {
  [CE.RECURSION_DETECTED]: 'Can`t paste a patch into itself!',
  [CE.NO_REQUIRED_PATCHES]: 'Can`t find following patches: {missingPatches}',
};
