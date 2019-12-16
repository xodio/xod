import * as R from 'ramda';
import { defaultValueOfType, BINDABLE_CUSTOM_TYPES } from 'xod-project';

export default R.ifElse(
  R.test(/^#?([0-9a-f]{3}){1,2}$/i),
  R.compose(
    R.when(str => str.length === 4, R.replace(/[^#]/g, '$&$&')),
    R.toUpper,
    R.unless(R.startsWith('#'), R.concat('#'))
  ),
  R.always(defaultValueOfType(BINDABLE_CUSTOM_TYPES.COLOR))
);
