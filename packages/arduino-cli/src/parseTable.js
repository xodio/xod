/**
 * One bright day this module will be burned.
 * See: https://github.com/arduino/arduino-cli/issues/39
 */

import * as R from 'ramda';

export default data => {
  const table = R.compose(
    R.map(R.compose(R.map(R.trim), R.split('\t'))),
    R.split('\n'),
    R.trim
  )(data);

  const headers = table[0]; // first row are table headers

  return R.compose(
    R.map(
      R.addIndex(R.reduce)(
        (acc, v, idx) => (!headers[idx] ? acc : R.assoc(headers[idx], v, acc)),
        {}
      )
    ),
    R.tail
  )(table);
};
