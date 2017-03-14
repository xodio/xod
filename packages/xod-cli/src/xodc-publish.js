import Swagger from 'swagger-client';
import * as messages from './messages';

function run(promise) {
  promise.then((value) => {
    messages.success(value);
  }).catch((error) => {
    messages.error(error);
    process.exit(1);
  });
}

function j(object) {
  return JSON.stringify(object, null, 2);
}

export default function publish(swaggerUrl, libraryId, libVersion) {
  run(new Swagger({ url: swaggerUrl, usePromise: true }).then(
    client =>
      client.Library.readLibrary({ id: libraryId })
        .catch(error =>
          Promise.reject(`could not find library {id: ${libraryId}}.\nResponse: ${j(error.errObj)}`)
        )
        .then(() =>
          client.Library.createLibVersion({ id: libraryId, libVersion })
            .then(value =>
              `successfully created new version for library {id: ${libraryId}}.\nNew version: ${j(value.obj)}`
            )
            .catch(error =>
              Promise.reject(`could not create new version for library {id: ${libraryId}}.\nResponse: ${j(error.errObj)}`)
            )
        ),
    () => Promise.reject(`could not find swagger file at ${swaggerUrl}`)
  ));
}
