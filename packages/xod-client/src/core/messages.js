import composeMessage from '../messages/composeMessage';

// eslint-disable-next-line import/prefer-default-export
export const invalidUrlActionName = actionName =>
  composeMessage(
    'Bad link',
    `XOD link points to an unknown action '${actionName}'`
  );
