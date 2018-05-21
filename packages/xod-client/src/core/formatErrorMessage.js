import { composeErrorFormatters } from 'xod-func-tools';
import { messages as xpMessages } from 'xod-project';

import formatUnexpectedError from '../messages/formatUnexpectedError';

export default composeErrorFormatters([
  xpMessages,
  {
    UNEXPECTED_ERROR: formatUnexpectedError,
  },
]);
