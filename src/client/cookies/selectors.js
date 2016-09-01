import R from 'ramda';

// :: rootState -> rootState.cookies
export const cookies = R.prop('cookies');

// :: cookiesState -> access_token
export const accessToken = R.prop('access_token');

// :: cookiesState -> userId
export const userId = R.prop('user_id');

// :: cookiesState -> { access_token, user_id, username }
export const userInfo = R.pick(['access_token', 'user_id', 'username']);
