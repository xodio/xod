import R from 'ramda';

/**
 * Universal function, that normilizes fetch result to
 * rejected Promise. Useful to use with `retryOrFail` as `errFn`.
 *
 * There is two possible cases for `res` argument:
 * - contains Error object (E.G. network error)
 *   it will just merge a payload to the Error.
 * - contains response object (E.G. unwanted response status)
 *   it will create new Error with statusText and merged
 *   status, statusText and payload
 */
// :: Object -> (FetchResult | Error) -> Error
export const rejectFetchResult = R.curry(
  (payload, res) => (
    res.status ?
      Object.assign(
        new Error(res.statusText),
        {
          status: res.status,
          statusText: res.statusText,
        },
        payload
      ) :
      Object.assign(res, payload)
  )
);

export default {};
