import swaggerClient from 'swagger-client';

export function stringifyError(error) {
  const { response, status } = error;
  let res;
  if (response.body && response.body.originalResponse) {
    res = JSON.parse(response.body.originalResponse);
  } else if (response.body) {
    res = response.body;
  } else {
    res = response;
  }
  return `${status} ${JSON.stringify(res, null, 2)}`;
}

export function client(swaggerUrl) {
  return swaggerClient(swaggerUrl)
    .catch(() => Promise.reject(`could not find swagger at "${swaggerUrl}".`));
}
