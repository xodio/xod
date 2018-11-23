import { composeErrorFormatters } from 'xod-func-tools';
import { messages as xpMessages } from 'xod-project';
import { messages as xardMessages } from 'xod-arduino';

import formatUnexpectedError from '../messages/formatUnexpectedError';

export default composeErrorFormatters([
  xpMessages,
  xardMessages,
  {
    UNEXPECTED_ERROR: formatUnexpectedError,
  },
]);
