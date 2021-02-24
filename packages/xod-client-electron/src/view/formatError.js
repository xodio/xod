import { composeErrorFormatters } from 'xod-func-tools';
import { messages as xpMessages } from 'xod-project';
import { messages as xdMessages } from 'xod-deploy';
import { messages as xdbMessages } from 'xod-deploy-bin';
import { messages as xardMessages } from 'xod-arduino';
import { messages as xfMessages } from 'xod-fs';

import uploadMessages from '../upload/messages';

export const formatErrorMessage = composeErrorFormatters([
  xpMessages,
  xdMessages,
  xdbMessages,
  xardMessages,
  xfMessages,
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
