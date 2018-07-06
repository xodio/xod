import composeMessage from '../messages/composeMessage';

// eslint-disable-next-line import/prefer-default-export
export const PROJECT_BROWSER_ERRORS = {
  PATCH_NAME_TAKEN: composeMessage('Patch name already taken'),
  INVALID_PATCH_NAME: composeMessage('Invalid patch name'),
  INVALID_PROJECT_NAME: composeMessage('Invalid project name'),
};
