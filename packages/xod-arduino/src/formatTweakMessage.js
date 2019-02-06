import * as R from 'ramda';

import { unquote } from 'xod-func-tools';
import * as XP from 'xod-project';

import { def } from './types';

import { byteLiteralToDecimal } from './templates';

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
        return `${prefix}:${byteLiteralToDecimal(value)}\r\n`;
      case XP.PIN_TYPE.PULSE:
        return `${prefix}\r\n`;
      case XP.PIN_TYPE.STRING:
        return R.compose(
          s => `${prefix}:${s}\r\n`,
          R.slice(0, XP.getStringTweakLength(nodeType)),
          unquote
        )(value);
      default:
        return '';
    }
  }
);
