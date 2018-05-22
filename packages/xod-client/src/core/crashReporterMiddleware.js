import { addError } from '../messages/actions';
import formatUnexpectedError from '../messages/formatUnexpectedError';

export default () => next => action => {
  try {
    return next(action);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);

    return next(addError(formatUnexpectedError(err), true));
  }
};
