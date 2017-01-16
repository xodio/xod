import R from 'ramda';

// :: rootState -> rootState.user
export const userLens = R.lensPath(['user']);
export const user = R.view(userLens);

// :: userState -> access_token
export const accessTokenLens = R.lensPath(['access_token']);
export const accessToken = R.view(accessTokenLens);

// :: userState -> userId
export const userIdLens = R.lensPath(['user_id']);
export const userId = R.view(userIdLens);

// :: userState -> { user_id, username, userpic }
export const userInfo = R.pick(['user_id, username, userpic']);

// :: userState -> username
export const username = R.prop('username');

// :: userState -> userpic
export const userpic = R.prop('userpic');

// :: userState -> [ project, ... ]
export const projects = R.prop('projects');

// :: [ project, ... ] -> { id: project, ... }
export const indexById = R.indexBy(R.prop('id'));
