import Routes from './routes';
import { call } from './utils';

export default {
  profile: {
    login: (username, password) => call({
      path: Routes.profile.login,
      method: 'post',
      body: {
        username: username || 'brusher',
        password: password || 'qwe123',
      },
      logout: () => call({
        path: Routes.profile.logout,
        method: 'post',
      }),
    }),
  },
};
