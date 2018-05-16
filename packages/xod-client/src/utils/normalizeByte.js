import * as R from 'ramda';
import { DEFAULT_VALUE_OF_TYPE, PIN_TYPE } from 'xod-project';

const parseBin = x => parseInt(x, 2);
const parseHex = x => parseInt(x, 16);

// 300 -> 255
// -5 -> 0
const limitByte = R.cond([
  [R.gt(R.__, 255), R.always(255)],
  [R.lt(R.__, 0), R.always(0)],
  [isNaN, R.always(0)],
  [R.T, R.identity],
]);

// 25 -> 00011001b
const toBin = R.compose(
  R.concat(R.__, 'b'),
  x => x.padStart(8, '0'),
  x => x.toString(2),
  limitByte
);

// 15 -> 0Fh
const toHex = R.compose(
  R.concat(R.__, 'h'),
  x => x.padStart(2, '0'),
  R.toUpper,
  x => x.toString(16),
  limitByte
);

// 15 -> 15d
const toDec = R.pipe(limitByte, x => x.toString(10), R.concat(R.__, 'd'));

const decValueOrDefault = R.pipe(
  x => parseInt(x, 10),
  R.ifElse(x => isNaN(x), R.always(DEFAULT_VALUE_OF_TYPE[PIN_TYPE.BYTE]), toDec)
);

// :: String -> String
export default R.cond([
  // 0b1011 -> 00001011b
  [R.startsWith('0b'), R.pipe(R.drop(2), parseBin, toBin)],
  // 1011b -> 00001011b
  [R.endsWith('b'), R.pipe(R.init, parseBin, toBin)],
  // ah -> 0Ah
  [R.endsWith('h'), R.pipe(R.init, parseHex, toHex)],
  // 0xfa -> FAh
  [R.startsWith('0x'), R.pipe(parseHex, toHex)],
  // 15d -> 15d
  [R.endsWith('d'), R.pipe(R.init, toDec)],
  // 15 -> 15d
  [R.T, decValueOrDefault],
]);
