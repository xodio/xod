import * as R from 'ramda';
import { Either } from 'ramda-fantasy';
import { def } from './types';
import { foldMaybe, foldEither } from './monads';

export const fail = def(
  'fail :: String -> Object -> Either Error a',
  (errorType, payload) => {
    const err = new Error(`${errorType} ${JSON.stringify(payload)}`);
    err.type = errorType;
    err.payload = payload;
    return Either.Left(err);
  }
);

// :: String -> Object -> ((a, ..., z) -> Boolean) -> ((a, ..., z) -> Either Error a)
export const failOnFalse = R.curry((errorType, payload, condition) =>
  R.ifElse(condition, Either.of, () => fail(errorType, payload))
);

// :: String -> Object -> Maybe a -> Either Error a
export const failOnNothing = R.curry((errorType, payload) =>
  foldMaybe(fail(errorType, payload), Either.of)
);

/**
 * Updates trace of the Error, produced by any of `fail` functions.
 * Will be used in functions that validates something recursively.
 */
export const prependTraceToError = def(
  'prependTraceToError :: String -> Either Error a -> Either Error a',
  (patchPath, either) =>
    foldEither(
      R.when(R.is(Error), err => {
        const newPayload = R.over(
          R.lensProp('trace'),
          R.pipe(R.defaultTo([]), R.concat([patchPath])),
          R.propOr({}, 'payload', err)
        );
        const newErr = R.compose(
          foldEither(e => {
            // We have to reassign stack to the new Error object
            // to keep the stack trace to place where error really occured
            // eslint-disable-next-line no-param-reassign
            e.stack = err.stack;
            return Either.Left(e);
          }, Either.of),
          fail
        )(err.type, newPayload);
        return newErr;
      }),
      Either.of,
      either
    )
);

export const composeErrorFormatters = def(
  'composeErrorFormatters :: [StrMap Error -> Stanza] -> (Error -> Stanza)',
  R.compose(
    errorFormatters => err => {
      const formatter = errorFormatters[err.type];
      if (!formatter) {
        // Fallback to ugly/default error message
        // if there is no messages for this type of error
        // or error has no type at all
        return { note: err.message };
      }
      return formatter(err.payload);
    },
    R.mergeAll
  )
);
