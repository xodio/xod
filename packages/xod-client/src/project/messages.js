import composeMessage from '../messages/composeMessage';
import {
  LINK_ERRORS as LE,
  NODETYPE_ERROR_TYPES as NTE,
} from '../editor/constants';

export const SUCCESSFULLY_PUBLISHED = composeMessage('Library published');

export const LINK_ERRORS = {
  [LE.SAME_DIRECTION]: composeMessage(
    'Canʼt create link between pins of the same direction!'
  ),
  [LE.SAME_NODE]: composeMessage(
    'Canʼt create link between pins of the same node!'
  ),
  [LE.ONE_LINK_FOR_INPUT_PIN]: composeMessage(
    'Input pin can have only one link!'
  ),
  [LE.UNKNOWN_ERROR]: composeMessage('Canʼt create link', 'Unknown error!'),
  [LE.INCOMPATIBLE_TYPES]: composeMessage('Incompatible pin types!'),
};

export const NODETYPE_ERRORS = {
  [NTE.CANT_DELETE_USED_PATCHNODE]: composeMessage(
    'Canʼt delete Patch',
    'Current Patch Node is used somewhere. You should remove it first!'
  ),
  [NTE.CANT_DELETE_USED_PIN_OF_PATCHNODE]: composeMessage(
    'Canʼt delete Pin',
    [
      'Current IO Node is represents a Pin of Patch Node.',
      'And it is used somewhere.',
      'You should remove a linkage first!',
    ].join(' ')
  ),
};

export const missingPatchForNode = patchPath =>
  `Patch with type "${patchPath}" is not found in the project`;
