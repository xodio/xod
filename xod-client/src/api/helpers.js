import R from 'ramda';
import * as Selectors from 'xod-client/user/selectors';
import { STATUS } from 'xod-client/utils/constants';

const notNil = R.complement(R.isNil);
const isSucceeded = R.pathEq(['meta', 'status'], STATUS.SUCCEEDED);
const hasResponse = R.pathSatisfies(notNil, ['payload', 'response']);
const completedResponse = R.allPass([isSucceeded, hasResponse]);
const currentUser = (action, state) => (
  hasResponse(action) &&
  action.payload.response.id === Selectors.userId(state)
);

const isError = R.propEq('error', true);

export default {
  isSucceeded,
  hasResponse,
  completedResponse,
  currentUser,
  isError,
};
