import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { createSelector } from 'reselect';

export const getUserState = R.prop('user');

export const getCompileLimitLeft = createSelector(
  getUserState,
  R.pathOr(null, ['balances', 'compile'])
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

export const getAccessToken = createSelector(
  getGrant,
  R.map(R.prop('accessToken'))
);

export const getUser = createSelector(getGrant, R.map(R.prop('user')));

export const isAuthorized = createSelector(getUser, Maybe.isJust);
