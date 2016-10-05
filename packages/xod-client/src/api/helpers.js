import R from 'ramda';
import * as Selectors from '../user/selectors';
import { STATUS } from '../utils/constants';

const notNil = R.complement(R.isNil);
const isSucceeded = R.pathEq(['meta', 'status'], STATUS.SUCCEEDED);
const hasResponse = R.pathSatisfies(notNil, ['payload', 'response']);
const completedResponse = R.allPass([isSucceeded, hasResponse]);
const currentUser = (action, state) => (
  hasResponse(action) &&
  action.payload.response.id === Selectors.userId(state)
);

const isError = R.propEq('error', true);

const makeURISafeName = R.pipe(
  R.replace(' ', '_'),
  R.replace(/\W/g, ''),
  R.toLower
);

export default {
  isSucceeded,
  hasResponse,
  completedResponse,
  currentUser,
  isError,
  makeURISafeName,
};
