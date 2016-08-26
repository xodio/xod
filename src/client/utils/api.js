import R from 'ramda';
import { CALL_API } from 'redux-api-middleware';

const API_BASEPATH = 'http://0.0.0.0:3000/api';

const parseBody = (body) => JSON.stringify(body);

const generateTypes = (types, path) => {
  let prefix = 'API_';

  if (path === '' || path === '/') {
    prefix += 'ROOT_';
  } else {
    prefix += R.pipe(
      R.split('/'),
      R.tail,
      R.map(R.toUpper),
      R.append(''),
      R.join('_')
    )(path);
  }

  return R.map(type => `${prefix}${R.toUpper(type)}`)(types);
};

const call = (options) => {
  const path = options.path || '';
  const method = options.method || 'GET';
  const actionTypes = options.types || ['REQUEST', 'SUCCESS', 'FAILURE'];
  const types = generateTypes(actionTypes, path);
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

export const actionType = (type, path) => generateTypes([type], path)[0];

export const ApiActions = {
  profile: {
    login: () => call({
      path: '/Profiles/login',
      method: 'post',
      body: {
        username: 'brusher',
        password: 'qwe123',
      },
      logout: () => call({
        path: '/Profiles/logout',
        method: 'post',
      }),
    }),
  },
};
