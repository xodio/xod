import R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { notEmpty, notNil, rejectWithCode, foldMaybe } from 'xod-func-tools';

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

// :: String -> Boolean
export const isLibQueryValid = R.compose(
  Maybe.isJust,
  parseLibQuery
);

// :: LibQueryParams -> LibName
export const stringifyLibQuery = ({ owner, name, version }) => `${owner}/${name}@${version}`;

// :: (LibQueryParams -> Promise a) -> Maybe LibQueryParams -> Promise a Error
export const unfoldMaybeLibQuery = R.curry(
  (justFn, maybe) => foldMaybe(
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
