import * as R from 'ramda';

import { POPUP_ID } from './constants';

const defaultPopupState = {
  visible: false,
  data: {},
};

export default R.compose(
  R.mergeAll,
  R.map(R.objOf(R.__, R.clone(defaultPopupState))),
  R.values
)(POPUP_ID);
