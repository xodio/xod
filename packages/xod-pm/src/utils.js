import R from 'ramda';
import swaggerClient from 'swagger-client';
import { Maybe } from 'ramda-fantasy';
import {
  notEmpty,
  notNil,
  rejectWithCode,
  maybeToPromise,
  explodeMaybe,
} from 'xod-func-tools';

import * as ERR_CODES from './errorCodes';
import * as MSG from './messages';

const LATEST = 'latest';

// :: Nullable String -> String
export const prependVIfNeeded = R.when(
  R.allPass([
    notNil,
    notEmpty,
    R.compose(
      R.complement(R.equals('v')),
      R.nth(0)
    ),
    R.complement(R.equals(LATEST)),
  ]),
  R.concat('v')
);

// :: Nullable String -> String
export const defaultToLatest = R.when(
  R.anyPass([
    R.isEmpty,
    R.isNil,
  ]),
  R.always(LATEST)
);

// :: String -> Maybe LibQueryParams
export const parseLibQuery = R.compose(
  R.map(R.applySpec({
    owner: R.nth(0),
    name: R.nth(1),
    version: R.compose(
      defaultToLatest,
      prependVIfNeeded,
      R.nth(2)
    ),
  })),
  R.ifElse(
    R.compose(R.gt(R.__, 1), R.length),
    Maybe.of,
    Maybe.Nothing,
  ),
  R.reject(R.isEmpty),
  R.tail,
  R.match(/^([^@/]+?)\/([^@/]+?)(?:@([^@/]+?))?$/)
);

// :: String -> LibName
// It parses libQuery ("xod/core" or "xod/core@0.11.0")
// and returns lib name without version ("xod/core").
export const getLibName = libQuery => R.compose(
  qp => `${qp.owner}/${qp.name}`,
  explodeMaybe(`Expected correct library name format, like "xod/core@0.11.0", but got "${libQuery}"`),
  parseLibQuery
)(libQuery);

// :: String -> Boolean
export const isLibQueryValid = R.compose(
  Maybe.isJust,
  parseLibQuery
);

// :: LibQueryParams -> LibName
export const stringifyLibQuery = ({ owner, name, version }) => `${owner}/${name}@${version}`;

// :: (LibQueryParams -> a) -> Maybe LibQueryParams -> Promise a Error
export const unfoldMaybeLibQuery = R.curry(
  (justFn, maybe) => maybeToPromise(
    () => rejectWithCode(
      ERR_CODES.CANT_PARSE_LIBRARY_REQUEST,
      new Error(MSG.CANT_PARSE_LIBRARY_REQUEST)
    ),
    justFn,
    maybe
  )
);

// :: LibParams -> LibData -> Promise LibData Error
export const rejectUnexistingVersion = R.curry(
  (params, libdata) => R.ifElse(
    R.propEq('version', LATEST),
    () => Promise.resolve(libdata),
    () => R.ifElse(
      R.compose(
        R.contains(params.version),
        R.prop('versions')
      ),
      Promise.resolve.bind(Promise),
      () => rejectWithCode(
        ERR_CODES.CANT_FIND_LIB_VERSION,
        new Error(MSG.cantFindLibVersion(params))
      )
    )(libdata)
  )(params)
);

// :: LibData -> Nullable String
export const getLibVersion = R.curry(
  (libData) => {
    const version = R.path(['requestParams', 'version'], libData);
    const versions = R.prop('versions', libData);

    return (version === LATEST)
      ? R.head(versions)
      : R.compose(
          R.defaultTo(null),
          R.find(R.equals(version))
        )(versions);
  }
);

// Create memoized function to prevent fetching swagger URL
// on each fetch request
export const getSwaggerClient = (() => {
  const memo = {};

  return (url) => {
    const index = JSON.stringify(url);

    if (index in memo) {
      return memo[index];
    }

    return (memo[index] = swaggerClient(url));
  };
})();

// TODO: duplicate in xod-cli
export const swaggerError = (err) => {
  if (err instanceof Error) {
    return Object.assign(
      new Error(MSG.SERVICE_UNAVAILABLE),
      { errorCode: ERR_CODES.SERVICE_UNAVAILABLE }
    );
  }

  const { response, status } = err;
  let res;
  if (response.body && response.body.originalResponse) {
    res = JSON.parse(response.body.originalResponse);
  } else if (response.body) {
    res = response.body;
  } else {
    res = response;
  }

  if (status === 400) {
    return new Error(R.pathOr('Bad request', ['errors', 0, 'errors', 0, 'message'], res));
  }

  return new Error(`${status} ${JSON.stringify(res, null, 2)}`);
};
