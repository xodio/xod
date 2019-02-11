import R from 'ramda';
import { def } from './types';

export const enquote = def('enquote :: String -> String', s => `"${s}"`);

export const unquote = def(
  'unquote :: String -> String',
  R.when(R.test(/^".*"$/), R.pipe(R.init, R.tail))
);

/**
 * Converts String with unicode characters into String with
 * unicode sequences.
 * E.G.
 * "> Hello ⏅😬 Мир!" -> "U003E Hello U23c5Ud83d U041cU0438U0440!"
 */
export const unicodeCharsToUnicodeSequence = def(
  'unicodeCharsToUnicodeSequence :: String -> String',
  R.compose(
    R.join(''),
    R.reduce((acc, char) => {
      const isValidCppChar = R.test(/[0-9a-zA-Z_]/, char);
      const charCode = char.charCodeAt(0);
      const escape = charCode.toString(16);
      return R.append(
        isValidCppChar ? char : `U${`0000${escape}`.slice(-4).toUpperCase()}`,
        acc
      );
    }, []),
    R.split('')
  )
);

/**
 * Escape non-C++ friendly characters:
 * - Space (" ") -> "_"
 * - Minus ("-") -> "_"
 * - Custom unicode ("δ") -> Unicode sequence ("U03B4")
 * - Custom rare unicode ("🙀") -> "U1F640"
 */
export const cppEscape = def(
  'cppEscape :: String -> String',
  R.compose(unicodeCharsToUnicodeSequence, R.replace(/(\s|-)+/g, '_'), R.trim)
);
