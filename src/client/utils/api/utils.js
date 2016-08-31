import R from 'ramda';
import { CALL_API } from 'redux-api-middleware';
import { STATUS } from 'xod/client/utils/constants';
import { API_BASEPATH } from './routes';

export const parseBody = (body) => JSON.stringify(body);

export const generateType = (path) => {
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

export const generateActionCreators = (actionType, path) => R.pipe(
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

export const call = (options) => {
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
