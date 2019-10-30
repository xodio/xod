import { isAmong } from 'xod-func-tools';
import { GLOBALS_LITERALS } from 'xod-project';

// Stanza creators.
// See `xod-func-tools` package Stanza type
export default {
  TOO_MANY_OUTPUTS_FOR_NATIVE_NODE: ({ patchPath }) => ({
    title: 'Too many outputs',
    note: `C++ node ${patchPath} has more than 7 outputs. This is a limit for nodes implemented natively.`,
    solution:
      'Try to express the node as a XOD patch node composed of smaller C++ nodes or group the outputs into a new custom type.',
  }),
  GLOBAL_LITERAL_VALUE_MISSING: ({ key }) => {
    const messages = {
      UNKNOWN_LITERAL: {
        title: 'Unknown literal',
        note: `The program uses an unknown \`=${key}\` literal.`,
        solution: `Check the literal spelling. See globals reference: https://xod.io/docs/reference/globals/`,
      },
      VALUE_MISSING: {
        title: 'Value for the literal is missing',
        note: `The program uses the \`=${key}\` literal, but XOD does not know the value for this literal.`,
        solution:
          'Report the bug on the forum and attach the xodball if possible',
      },
    };

    if (messages[key]) {
      return messages[key];
    } else if (isAmong(GLOBALS_LITERALS, `=${key}`)) {
      return messages.VALUE_MISSING;
    }
    return messages.UNKNOWN_LITERAL;
  },
};
