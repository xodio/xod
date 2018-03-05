import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { createSelector } from 'reselect';

export const getUserState = R.prop('user');

export const getCompileLimit = createSelector(getUserState, R.prop('limit'));

export const getCompileLimitLeft = createSelector(
  getCompileLimit,
  limit => (limit ? limit.limit - limit.pending - limit.used : null)
);

export const isAccountPaneVisible = createSelector(
  getUserState,
  R.prop('isAccountPaneVisible')
);

export const isAuthorising = createSelector(
  getUserState,
  R.prop('isAuthorising')
);

export const getGrant = createSelector(
  getUserState,
  R.pipe(R.prop('grant'), Maybe)
);

export const getUser = createSelector(getGrant, R.map(R.prop('user')));

export const isAuthorized = createSelector(getUser, Maybe.isJust);
