import R from 'ramda';
import swaggerClient from 'swagger-client';
import {
  retryOrFail,
  rejectFetchResult,
  rejectWithCode,
  eitherToPromise,
  isAmong,
} from 'xod-func-tools';
import { fromXodballData, listMissingLibraryNames } from 'xod-project';

import * as ERR_CODES from './errorCodes';
import { parseLibQuery, unfoldMaybeLibQuery, rejectUnexistingVersion } from './utils';

// =============================================================================
//
// Utils
//
// =============================================================================

// :: (b -> c) -> (() => Promise a b) -> Promise a c
const retryExcept404 = retryOrFail(
  [500, 1000, 2000, 3000],
  res => (res.status && res.status === 404),
);

// Create memoized function to prevent fetching swagger URL
// on each fetch request
const getSwaggerClient = (() => {
  const memo = {};

  return (url) => {
    const index = JSON.stringify(url);

    if (index in memo) {
      return memo[index];
    }

    return (memo[index] = swaggerClient(url));
  };
})();

// =============================================================================
//
// Fetching data
//
// =============================================================================

// LibData :: { owner: String, name: String, version: String }

// :: URL -> LibName -> Promise LibData Error
export const fetchLibData = R.curry((swaggerUrl, libQuery) =>
  getSwaggerClient(swaggerUrl)
    .then(swagger =>
      R.compose(
        unfoldMaybeLibQuery(
          params => swagger.apis.Library.getOrgLib({
            libname: params.name,
            orgname: params.owner,
          })
          .catch(
            retryExcept404(
                rejectFetchResult({
                  errorCode: ERR_CODES.CANT_FIND_LIB_BY_NAME,
                  request: libQuery,
                  params,
                }),
              () => fetchLibData(swaggerUrl, libQuery)
            )
          )
          .then(R.prop('obj'))
          .then(rejectUnexistingVersion(params))
          .then(R.assoc('requestParams', params))
        ),
        parseLibQuery
      )(libQuery)
    )
);

// :: URL -> LibName -> Promise Project Error
export const fetchLibrary = R.curry((swaggerUrl, libQuery) =>
  getSwaggerClient(swaggerUrl)
    .then(swagger =>
      R.compose(
        unfoldMaybeLibQuery(
          params => swagger.apis.Version.getLibVersionXodball({
            libname: params.name,
            orgname: params.owner,
            semver_or_latest: params.version,
          })
            .catch(
              retryExcept404(
                rejectFetchResult({
                  errorCode: ERR_CODES.CANT_GET_LIB_XODBALL,
                  request: libQuery,
                  params,
                }),
                () => fetchLibrary(swaggerUrl, libQuery)
              )
            )
            .then(R.prop('obj'))
            .then(xodball =>
              R.compose(eitherToPromise, fromXodballData)(xodball)
                .catch(rejectWithCode(ERR_CODES.INVALID_XODBALL))
            )
        ),
        parseLibQuery
      )(libQuery)
    )
);

// :: URL -> LibName -> Promise [Project] Error
export const fetchLibraryWithDependencies = R.curry((swaggerUrl, libQuery) => {
  // :: Map LibName Project -> [LibName] -> Promise Map LibName Project Error
  const fetchReqursively = R.curry((fetchedLibs, libNamesToFetch) => {
    if (libNamesToFetch.length === 0) return Promise.resolve(fetchedLibs);

    const nextLibName = R.head(libNamesToFetch);
    return fetchLibrary(swaggerUrl, nextLibName)
      .then((lib) => {
        const nextFetchedLibs = R.assoc(nextLibName, lib, fetchedLibs);
        const fetchedLibNames = R.keys(nextFetchedLibs);
        const nextLibNamesToFetch = R.compose(
          R.concat(R.__, R.tail(libNamesToFetch)),
          R.reject(isAmong(fetchedLibNames)),
          listMissingLibraryNames
        )(lib);

        return fetchReqursively(nextFetchedLibs, nextLibNamesToFetch);
      });
  });

  return fetchReqursively({}, [libQuery]);
});
