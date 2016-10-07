import R from 'ramda';
import Cookies from 'js-cookie';
import { CALL_API } from 'redux-api-middleware';
import { STATUS } from '../utils/constants';
import { API_BASEPATH } from './routes';

import { getProccesses, findProcessByPath } from '../processes/selectors';

export const parseBody = (body) => JSON.stringify(body);

export const generateType = (route) => {
  const method = String(route.method).toUpperCase();
  const path = route.path;
  let actionType = `${method}@API/`;

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

export const generateActionCreators = (route, callPath) => {
  const actionType = generateType(route);
  const path = callPath;

  return R.map(type => ({
    type: actionType,
    payload: (action, state, res) => {
      const processes = getProccesses(state);
      const proc = findProcessByPath(callPath)(processes);
      if (!proc) { return { path }; }

      const id = R.prop('id', proc);
      if (!res) { return ({ id, path }); }


      return res.json().then(
        json =>
        ({
          id,
          path,
          response: json,
        })
      );
    },
    meta: {
      status: STATUS[type],
    },
  }), ['STARTED', 'SUCCEEDED', 'FAILED']);
};

const processPath = R.curry((parts, path) => R.pipe(
  R.split('/'),
  R.map(part => {
    if (part[0] === ':') {
      return parts[R.tail(part)];
    }

    return part;
  }),
  R.join('/')
)(path));

export const call = (route, options = {}) => {
  const parts = options.parts || {};
  const callPath = processPath(parts, route.path);
  const types = generateActionCreators(route, callPath);
  const headers = R.merge({
    'Content-Type': 'application/json',
    Authorization: Cookies.get('access_token'),
  }, options.headers);
  const body = parseBody(options.body) || null;
  const credentials = options.credentials || 'include';

  return {
    [CALL_API]: {
      endpoint: `${API_BASEPATH}${callPath}`,
      method: route.method,
      types,
      headers,
      body,
      credentials,
    },
  };
};
