import R from 'ramda';
import { Either } from 'ramda-fantasy';

export const expectEither = R.curry((testFunction, object) => {
  Either.either(
    (err) => { throw err; },
    testFunction,
    object
  );
});
