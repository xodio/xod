import swaggerClient from 'swagger-client';

export function error(err) {
  const { response, status } = err;
  let res;
  if (response.body && response.body.originalResponse) {
    res = JSON.parse(response.body.originalResponse);
  } else if (response.body) {
    res = response.body;
  } else {
    res = response;
  }
  return new Error(`${status} ${JSON.stringify(res, null, 2)}`);
}

export async function client(url, opts = {}) {
  try {
    return await swaggerClient(url, opts);
  } catch (err) {
    throw new Error(`could not find swagger at "${url}".`);
  }
}
