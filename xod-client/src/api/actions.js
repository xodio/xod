import Cookies from 'js-cookie';

import Routes from './routes';
import { call } from './utils';

const profileId = () => Cookies.get('user_id');

const Actions = {
  profile: {},
  project: {},
};


Actions.profile.login = (username, password) =>
  call(
    Routes.user.login,
    {
      body: {
        username: username || '',
        password: password || '',
      },
    }
  );

Actions.profile.logout = () => call(Routes.user.logout);

Actions.profile.user = (userId) =>
  call(
    Routes.user.findById,
    {
      parts: {
        userId,
      },
    }
  );

Actions.profile.me = () => Actions.profile.user(profileId());

Actions.profile.projects = (userId) =>
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
        profileId: profileId(),
      },
    }
  );

export default Actions;
