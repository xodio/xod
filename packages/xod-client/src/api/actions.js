import R from 'ramda';
import Cookies from 'js-cookie';
import core from 'xod-core';

import Routes from './routes';
import { call } from './utils';
import helpers from './helpers';

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

Actions.user.user = userId =>
  call(
    Routes.user.findById,
    {
      parts: {
        userId,
      },
    }
  );

Actions.user.me = () => Actions.user.user(getUserId());

Actions.user.projects = userId =>
  call(
    Routes.user.projects,
    {
      parts: {
        userId,
      },
    }
  );

Actions.project.load = projectId =>
  call(
    Routes.project.load,
    {
      parts: {
        projectId,
      },
    }
  );

Actions.project.save = (projectData) => {
  const projectMeta = core.getMeta(projectData);
  const projectServerId = core.getId(projectMeta);
  const projectName = R.pipe(
    core.getName,
    helpers.makeURISafeName
  )(projectMeta);

  return call(
    Routes.project.save,
    {
      body: {
        id: projectServerId,
        name: projectName,
        pojo: JSON.stringify(projectData),
        public: true,
        ownerId: getUserId(),
      },
    }
  );
};

export default Actions;
