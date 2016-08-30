import R from 'ramda';
import { CALL_API } from 'redux-api-middleware';
import { STATUS } from 'xod/client/utils/constants';

const API_BASEPATH = 'http://0.0.0.0:3000/api';

const parseBody = (body) => JSON.stringify(body);

const generateType = (path) => {
  let actionType = 'API/';

  if (path === '' || path === '/') {
    actionType += 'ROOT_';
  } else {
    actionType += R.pipe(
      R.split('/'),
      R.tail,
      R.map(R.toUpper),
      R.join('_')
    )(path);
  }

  return actionType;
};

const generateActionCreators = (actionType, path) => R.pipe(
  R.map(type => ({
    type: generateType(path),
    payload: (action, state, res) => {
      if (res) {
        return res.json().then(
          json =>
          ({
            id: path, // @TODO: roll back to ID, but find it by path
            response: json,
          })
        );
      }

      return ({ id: path });
    },
    meta: {
      status: STATUS[type],
    },
  }))
)(['STARTED', 'SUCCEEDED', 'FAILED']);

const call = (options) => {
  const path = options.path || '';
  const method = options.method || 'GET';
  const actionType = generateType(path);
  const types = generateActionCreators(actionType, path);
  const headers = options.headers || {
    'Content-Type': 'application/json',
  };
  const body = parseBody(options.body) || '';
  const credentials = options.credentials || 'include';

  return {
    [CALL_API]: {
      endpoint: `${API_BASEPATH}${path}`,
      method,
      types,
      headers,
      body,
      credentials,
    },
  };
};

const ApiPath = {
  profile: {
    login: '/Profiles/login',
    logout: '/Profiles/logout',
  },
};

export const ApiTypes = {
  profile: {
    login: generateType(ApiPath.profile.login),
    logout: generateType(ApiPath.profile.logout),
  },
};

export const ApiActions = {
  profile: {
    login: (username, password) => call({
      path: ApiPath.profile.login,
      method: 'post',
      body: {
        username: username || 'brusher',
        password: password || 'qwe123',
      },
      logout: () => call({
        path: ApiPath.profile.logout,
        method: 'post',
      }),
    }),
  },
};
