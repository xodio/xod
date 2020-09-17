import * as R from 'ramda';

import { unquote } from 'xod-func-tools';
import * as XP from 'xod-project';

import { def } from './types';

import { byteLiteralToDecimal } from './templates';

// Convert char literals to decimal byte literals
// E.G. `'a'` -> `97d`
const charLiteralToByteLiteral = R.when(
  XP.isLikeCharLiteral,
  R.compose(
    R.concat(R.__, 'd'),
    R.toString,
    a => a.charCodeAt(0),
    R.nth(1),
    R.match(XP.charLiteralRegExp)
  )
);

const formatByteLiteral = R.compose(
  byteLiteralToDecimal,
  charLiteralToByteLiteral
);

export default def(
  'formatTweakMessage :: PatchPath -> NodeId -> DataValue -> String',
  (nodeType, nodeId, value) => {
    const prefix = `+XOD:${nodeId}`;
    switch (XP.getTweakType(nodeType)) {
      case XP.PIN_TYPE.NUMBER:
        return `${prefix}:${value}\r\n`;
      case XP.PIN_TYPE.BOOLEAN:
        return `${prefix}:${value === 'True' ? '1' : '0'}\r\n`;
      case XP.PIN_TYPE.BYTE:
        return `${prefix}:${formatByteLiteral(value)}\r\n`;
      case XP.PIN_TYPE.PULSE:
        return `${prefix}\r\n`;
      case XP.PIN_TYPE.STRING:
        return R.compose(
          s => `${prefix}:${s}\r\n`,
          R.slice(0, XP.getStringTweakLength(nodeType)),
          unquote
        )(value);
      case XP.BINDABLE_CUSTOM_TYPES.COLOR:
        return R.compose(
          ([r, g, b]) => `${prefix}:${r},${g},${b}\r\n`,
          R.map(x => parseInt(x, 16)),
          R.splitEvery(2),
          R.tail
        )(value);
      default:
        return '';
    }
  }
);
