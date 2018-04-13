import * as R from 'ramda';
import { Either } from 'ramda-fantasy';
import { def } from './types';
import { foldMaybe } from './monads';

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
