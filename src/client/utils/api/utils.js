import R from 'ramda';
import { CALL_API } from 'redux-api-middleware';
import { STATUS } from 'xod/client/utils/constants';
import { API_BASEPATH } from './routes';

import { getProccesses, findProcessByPath } from 'xod/client/processes/selectors';

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
      const processes = getProccesses(state);
      const proc = findProcessByPath(path)(processes);
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
