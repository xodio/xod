import Cookies from 'js-cookie';

import Routes from './routes';
import { call } from './utils';

const getUserId = () => Cookies.get('user_id');

const Actions = {
  user: {},
  project: {},
};


Actions.user.login = (username, password) =>
  call(
    Routes.user.login,
    {
      body: {
        username: username || '',
        password: password || '',
      },
    }
  );

Actions.user.logout = () => call(Routes.user.logout);

Actions.user.user = (userId) =>
  call(
    Routes.user.findById,
    {
      parts: {
        userId,
      },
    }
  );

Actions.user.me = () => Actions.user.user(getUserId());

Actions.user.projects = (userId) =>
  call(
    Routes.user.projects,
    {
      parts: {
        userId,
      },
    }
  );

Actions.project.load = (projectId) =>
  call(
    Routes.project.load,
    {
      parts: {
        projectId,
      },
    }
  );

Actions.project.save = (projectData) =>
  call(
    Routes.project.save,
    {
      body: {
        name: 'My project',
        pojo: JSON.stringify(projectData),
        public: true,
        userId: getUserId(),
      },
    }
  );

export default Actions;
