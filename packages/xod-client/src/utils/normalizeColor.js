import * as R from 'ramda';
import { DEFAULT_VALUE_OF_TYPE, CUSTOM_TYPE } from 'xod-project';

export default R.ifElse(
  R.test(/^#([0-9a-f]{3}){1,2}$/i),
  R.compose(
    R.when(str => str.length === 4, R.replace(/[^#]/g, '$&$&')),
    R.toUpper
  ),
  R.always(DEFAULT_VALUE_OF_TYPE[CUSTOM_TYPE.COLOR])
);
