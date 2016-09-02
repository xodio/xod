import Cookies from 'js-cookie';

import Routes from './routes';
import { call } from './utils';

const Actions = {
  profile: {},
};


Actions.profile.login = (username, password) =>
  call({
    method: 'post',
    path: Routes.profile.login,
    body: {
      username: username || 'brusher',
      password: password || 'qwe123',
    },
  });

Actions.profile.logout = () =>
  call({
    method: 'post',
    path: Routes.profile.logout,
  });

Actions.profile.user = (userId) =>
  call({
    method: 'get',
    path: Routes.profile.user,
    parts: {
      userId,
    },
  });

Actions.profile.me = () => Actions.profile.user(Cookies.get('user_id'));

export default Actions;
