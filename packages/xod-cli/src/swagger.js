import swaggerClient from 'swagger-client';

export function stringifyError(error) {
  return `${error.status} ${JSON.stringify(error.response.body, null, 2)}`;
}

export function client(swaggerUrl) {
  return swaggerClient(swaggerUrl)
    .catch(() => Promise.reject(`could not find swagger at "${swaggerUrl}".`));
}
