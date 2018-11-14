import { composeErrorFormatters } from 'xod-func-tools';
import { messages as xpMessages } from 'xod-project';
import { messages as xdMessages } from 'xod-deploy';
import { messages as xdbMessages } from 'xod-deploy-bin';

import uploadMessages from '../upload/messages';

export const formatErrorMessage = composeErrorFormatters([
  xpMessages,
  xdMessages,
  xdbMessages,
  uploadMessages,
]);

export const formatLogError = error => {
  const stanza = formatErrorMessage(error);
  return [
    ...(stanza.title ? [stanza.title] : []),
    ...(stanza.path ? [stanza.path.join(' -> ')] : []),
    ...(stanza.note ? [stanza.note] : []),
    ...(stanza.solution ? [stanza.solution] : []),
  ].join('\n');
};
