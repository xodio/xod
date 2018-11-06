import fetch from 'node-fetch';
import { createError } from 'xod-func-tools';

const getProto = apiSuffix =>
  ['xod.io', 'xod.show'].indexOf(apiSuffix) >= 0 ? 'https' : 'http';

const myFetch = (input, init) =>
  fetch(input, init).then(res => {
    if (!res.ok) {
      return Promise.reject(res);
    }
    return res;
  });

const getAccessToken = (apiSuffix, username, password) => {
  const reqUrl = `${getProto(apiSuffix)}://pm.${apiSuffix}/auth`;
  return myFetch(reqUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })
    .then(res => res.json())
    .then(body => {
      if (!body.access_token)
        throw createError('PUBLISH_AUTH_FAILED', {
          username,
          status: `Access Token doesn't exists in response!`,
        });
      return body.access_token;
    });
};

const getUser = (apiSuffix, username) => {
  const reqUrl = `${getProto(apiSuffix)}://pm.${apiSuffix}/users/${username}`;
  return myFetch(reqUrl).then(res => res.json());
};

const getLib = (apiSuffix, username, libname) => {
  const reqUrl = `${getProto(
    apiSuffix
  )}://pm.${apiSuffix}/users/${username}/libs/${libname}`;
  return myFetch(reqUrl);
};

const putUserLib = (apiSuffix, token, username, libname) => {
  const reqUrl = `${getProto(
    apiSuffix
  )}://pm.${apiSuffix}/users/${username}/libs/${libname}`;
  return myFetch(reqUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

const postUserLib = (apiSuffix, token, username, libname, version) => {
  const reqUrl = `${getProto(
    apiSuffix
  )}://pm.${apiSuffix}/users/${username}/libs/${libname}/versions`;
  return myFetch(reqUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(version),
  });
};

export { getAccessToken, getLib, getUser, myFetch, postUserLib, putUserLib };
