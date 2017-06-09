import swaggerClient from 'swagger-client';

// export const URL = 'http://pm.xod.show/swagger';
export const URL = 'http://localhost:10010/swagger';

export function stringifyError(error) {
  return `${error.status} ${JSON.stringify(error.response.body, null, 2)}`;
}

export function client(url) {
  return swaggerClient(url)
    .catch(() => Promise.reject(`could not find swagger file at "${url}".`));
}
