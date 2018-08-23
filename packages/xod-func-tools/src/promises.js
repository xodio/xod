import * as R from 'ramda';

/**
 * Like `R.tap` but works with Promises.
 * @param {Function} promiseFn Function that returns Promise
 * @returns {Function} Run promiseFn with argument and returns the same argument on resolve
 */
export const tapP = promiseFn => arg => promiseFn(arg).then(R.always(arg));

// :: ERROR_CODE -> Error -> Promise.Reject Error
export const rejectWithCode = R.curry((code, err) =>
  Promise.reject(Object.assign(err, { errorCode: code }))
);

// :: [Promise a] -> Promise a
export const allPromises = promises => Promise.all(promises);

/**
 * Helper for function compositions where Promises appears
 * near the end of the function chain. Otherwise, use `composeP`.
 */
// :: (a -> b) -> Promise a -> Promise b
export const then = R.curry((fn, promise) => promise.then(fn));

// :: Number -> Promise.Resolved ()
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utility function to retry getting data from somewhere N times
 * with some delays. It works with Promisified `retryFn`.
 *
 * Arguments:
 * - `delays`  - a list of delays (numbers) between each attempt in ms.
 *               If all attempts has left it will return Rejected Promise
 *               with latest data, passed through `errFn`.
 * - `stopFn`  - predicate function to stop retrying if Promise rejected
 *               with an Error, that should be returned. If in some case
 *               no such conditions, just return `false` on each call.
 * - `errFn`   - function, that could transform catched error.
 * - `retryFn` - function to retry
 *
 * E.G.
 * ```
 * // Let's imagine that `fetchSomething` fetches some data and returns
 * // Resolved Promise on 200OK status, in all other cases returns Rejected
 * fetchSomething()
 *   .catch(
 *     retryOrFail(
 *       [500, 1000, 2000], // retry after 500ms, then 1000ms, then 2000ms
 *       errRes => (errRes.status && errRes.status === 404), // stop if server returned 404
 *       R.identity, // do not transform errored server response
 *       fetchSomething
 *     )
 *   );
 * ```
 */
// :: [Number] -> (b -> Boolean) -> (b -> Error) -> (() -> Promise a b) -> (b -> Promise a b)
export const retryOrFail = R.curry((delays, stopFn, errFn, retryFn) => {
  const maxRetries = delays.length;
  let retryCounter = 0;

  const run = data =>
    new Promise((resolve, reject) => {
      if (stopFn(data) || retryCounter === maxRetries) {
        reject(errFn(data));
        return;
      }

      setTimeout(() => {
        retryCounter += 1;
        retryFn()
          .catch(run)
          .then(resolve)
          .catch(reject);
      }, delays[retryCounter]);
    });

  return run;
});
