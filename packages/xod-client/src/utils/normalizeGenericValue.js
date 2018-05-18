import * as R from 'ramda';
import { notNil } from 'xod-func-tools';
import {
  numberDataTypeRegExp,
  INPUT_PULSE_PIN_BINDING_OPTIONS,
} from 'xod-project';

import normalizeByte from './normalizeByte';
import normalizeNumber from './normalizeNumber';

// RegExps to test "Is it almost valid type X?"
const almostNumber = new RegExp(numberDataTypeRegExp.source, 'i');
const almostByte = /^\d+(h|d|b)$/i;
const almostBool = /^(true|false)$/i;
const almostPulse = /^(on boot|boot|onboot)|(continuously)|(never)$/i;

const capitalize = R.compose(
  R.join(''),
  R.over(R.lensIndex(0), R.toUpper),
  R.toLower
);

const isNthNotNil = x => R.pipe(R.nth(x), notNil);

const normalizePulse = R.compose(
  R.cond([
    // on boot
    [isNthNotNil(0), R.always(INPUT_PULSE_PIN_BINDING_OPTIONS.ON_BOOT)],
    // continuously
    [isNthNotNil(1), R.always(INPUT_PULSE_PIN_BINDING_OPTIONS.CONTINUOUSLY)],
    // never
    [isNthNotNil(2), R.always(INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER)],
  ]),
  R.slice(1, 4),
  R.match(almostPulse)
);

export default R.cond([
  [R.test(almostNumber), normalizeNumber],
  [R.test(almostByte), normalizeByte],
  [R.test(almostBool), capitalize],
  [R.test(almostPulse), normalizePulse],
  [R.T, R.identity],
]);
