import * as R from 'ramda';

const progressBarRegExp = /^\s?(?:[a-zA-Z0-9:@.\-_]+\s)?[0-9.]+(?:\s(?:Ki|Mi)?B)? \/ [0-9.]+(?:\s(?:Ki|Mi)?B)? (?:\[[=>-]+\])?\s+([0-9.]+)%\s?([0-9smh]+)?/;

export const parseProgressMessage = str =>
  R.compose(
    R.ifElse(
      R.test(progressBarRegExp),
      R.compose(
        res => ({
          percentage: res[1] ? parseInt(res[1], 10) : 0,
          estimated: res[2] || 'unknown',
          message: null,
        }),
        R.match(progressBarRegExp)
      ),
      message =>
        R.compose(
          percentage => ({
            percentage,
            estimated: 0,
            message,
          }),
          R.ifElse(
            R.test(/(downloaded|installed)/i),
            R.always(100),
            R.always(0)
          )
        )(message)
    ),
    R.replace(/\n/g, ''),
    R.replace(/\r/g, '')
  )(str);

export default onProgress =>
  R.pipe(
    R.split('\n'),
    R.reject(R.isEmpty),
    R.map(R.pipe(parseProgressMessage, onProgress))
  );
