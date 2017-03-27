import Swagger from 'swagger-client';

export const URL = 'http://localhost:10010/swagger';

export function stringifyValue(value) {
  const text = JSON.stringify(value.obj, null, 2);
  return `${value.status} ${text}`;
}

export function stringifyError(error) {
  if (typeof error === 'string') {
    return error;
  }
  const text = JSON.stringify(JSON.parse(error.errObj.response.text), null, 2);
  return `${error.errObj.status} ${text}`;
}

export function getClient(url) {
  return new Swagger({ url, usePromise: true }).catch(() =>
    Promise.reject(`could not find swagger file at "${url}".`)
  );
}
